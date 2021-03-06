"use strict"

// ----------------------------------------------------
//
// server.js contains the core of the git-viewer server
// using express and also workaholism
//
// ----------------------------------------------------


//------------------------------------
//
// IMPORTS, DECLARATIONS, VARIOUS TOMFOOLERY
//
//-------------------------------------

const express = require('express');					// main server framework
const url = require('url');							// url parsing
const query = require('querystring');				// query string parsing
const bodyParser = require('body-parser');			// for POST requests in express

const requestHandler = require('request');			// http/https requests
const env = require('node-env-file');				// local environment variables
const githubStrategy = require('passport-github').Strategy;	// oauth2
const passport = require('passport');

const moduleGenerator = require('./genmodule.js');	// for generating HTML/CSS

const port = process.env.PORT || process.env.NODE_PORT || 3000;
const GITHUB_API_URL = "https://api.github.com";


//------------------------------------
//
// OAUTH2 SETUP
//
//-------------------------------------


// My .env file does NOT exist in the git repository or in any public place.
// It contains the client ID, client secret, and personal token for the Github API.
// To create your own (and use this server locally), generate your own private strings at
// https://github.com/settings/developers
// and then make a .env file in the root directory of the repo (same directory as package.json) with the following contents:
//
// GITHUB_CLIENT_ID=[YOUR_ID_HERE]
// GITHUB_CLIENT_SECRET=[YOUR_SECRET_HERE]
// GITHUB_PERSONAL_TOKEN=[YOUR_TOKEN_HERE]
//
// do not use [] in your file. The personal token may or may not be used. 
//

// if environment variables are not defined, grab them locally
// env(".env");

// get our environmental variables for authentication
// const GITHUB_CLIENT_ID = process.env['GITHUB_CLIENT_ID'];
// const GITHUB_CLIENT_SECRET = process.env['GITHUB_CLIENT_SECRET'];
// const GITHUB_PERSONAL_TOKEN = process.env['GITHUB_PERSONAL_TOKEN'];


// set up oauth2 authentication using passport and the github strategy
// passport.use(new githubStrategy({
//   	clientID: GITHUB_CLIENT_ID,
//   	clientSecret: GITHUB_CLIENT_SECRET,
//   	callbackURL: "http://127.0.0.1:3000/auth/github/callback"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ githubId: profile.id }, function (err, user) {
//       return cb(err, user);
//     	});
// 	}
// ));

// we don't have an elegant way to do this (would need a db or something, probably)
// so we just serialize and deserialize the whole user. Deal with it.

// passport.serializeUser(function(user, cb) {
//   cb(null, user);
// });

// passport.deserializeUser(function(obj, cb) {
//   cb(null, obj);
// });
 

//------------------------------------
//
// SERVER CODE
//
//-------------------------------------

var app = express();

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


// session management
//app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));


// use passport on all requests
// app.use(passport.initialize());
// app.use(passport.session());

// CORS access for all requests
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});


// you won't get an error with no path at the moment, but you won't get any content, either
app.get('/',
	function(req,res){
		res.end();
});

//--------------------------------------------------------------------------------
//
// The /auth/github and /auth/github/callback paths are for authorization purposes,
// and don't really have much to do with the server behavior as a whole. Users shouldn't
// be calling these, and they won't have a great time if they do.
//
// ---------------------------------------------------------------------------------
// app.get('/auth/github', passport.authenticate('github'));

// app.get('/auth/github/callback', 
// 		passport.authenticate('github', {failureRedirect: '/login'}),
// 		function(req,res){res.redirect('/')
// 	});



//--------------------------------------------------------------------------------
//
// The /repo path requests a specific repository, with owner, username, and reponame
// querystring parameters. The returned JSON object contains a subset of the information
// available, namely:
//		ReadMe
//		Number of Commits made by User
//		Percentage of Total Contribution (additions + deletions vs total)
//		File Directory Tree (variety of information, including directory structure, download links, etc)
//
// ---------------------------------------------------------------------------------
app.get('/repo', function(request, response){

	// parse the request into a path and usable parameters
  	let parsedUrl = url.parse(request.url);
  	let params = query.parse(parsedUrl.query);
  	var repoData = {
  		readme: null,
  		commitCount: null,
  		contributionPercentage: null,
  		fileDirectory: null,
  	};

  	// make sure this response object is always the same format
  	Object.seal(repoData);

  	function setRepoData(datatype, data){
  		repoData[datatype] = data;

  		let completed = true;
  		for(var property in repoData){
  			if(repoData.hasOwnProperty(property) && repoData[property] == null)
  				completed = false;
  		}

  		if(completed){
  			response.write(JSON.stringify(repoData));
  			response.end();
  		}
  	}

  	// self-documenting function names, split up this way because they
  	// require different API calls and modularity is for cool kids
  	// I didn't want to pass in the response object to all of them, because it's only used for error catching,
  	// but decided that I'd rather be sloppy than rearchitect for error handling at the last minute

	requestRepoAnalytics(params.owner, params.username, params.reponame, setRepoData, response);
	requestRepoReadme(params.owner, params.reponame, setRepoData, response);
	requestRepoFileDirectory(params.owner, params.reponame, setRepoData, response);
  	

});

// --------------------------------------------------------------------------------
//
// The /repo/file path returns a specific file from a repository, with a downloadUrl
// querystring parameter. The returned JSON object contains the file as a single plaintext string.
//
// ---------------------------------------------------------------------------------
app.get('/repo/file', function(request, response){
	// parse the request into a path and usable parameters
  	let parsedUrl = url.parse(request.url);
  	let params = query.parse(parsedUrl.query);
	requestRepoFile(params.downloadUrl, response);

});


// --------------------------------------------------------------------------------
//
// The /user/repos path returns an array of all the repos the user has contributed
// to, with a username querystring parameter.
//
// ---------------------------------------------------------------------------------
app.get('/user/repos', function(request, response){
	// parse the request into a path and usable parameters
  	let parsedUrl = url.parse(request.url);
  	let params = query.parse(parsedUrl.query);
  	
	requestUserRepos(params.username,response);


});

// --------------------------------------------------------------------------------
//
// The /genCode path only accepts post methods - it generates HTML, CSS, and JS
// for the client module, then sends it all back to the requester. Look at the 
// code in genmodule.js for more information on the specifics of this.
//
// ---------------------------------------------------------------------------------
app.post("/genCode", function(request, response){
	console.dir(request.body)
	let obj = moduleGenerator.buildModule(request.body); // object already parsed by body-parser
	response.write(JSON.stringify(obj));
	response.status(200);
	response.end();
});

  

app.listen(port);


// --------------------------------------------------------------------------------
//
// Name: requestUserRepos
// 
// Description: gets basic information for all the repos a user has contributed to
//				(this information is on a single call to minimize API calls. githubAPI has a strict rate limit)
//				The array in the response contains name, description, language, last updated, and owner for each repo
// Params: 	username: 	the github username of the user, as a string
// 			response: 	the response object for this server query
//
// ---------------------------------------------------------------------------------

function requestUserRepos(username, response){

	function Repository(repoObj){
		this.name = repoObj.name;
		this.description = repoObj.description;
		this.language = repoObj.language;
		this.lastUpdated = repoObj.updated_at;
		this.owner = repoObj.owner.login;
	};
	
	var callback = function(error, res, body){	
		var repoObjs = JSON.parse(body);
		var repos = [];

		try{
			repoObjs.forEach(function(repo){
				repos.push(new Repository(repo));
			});
		}catch(err){
	  		checkRateLimit(response);
	  		return;
  		}		
		
		response.write(JSON.stringify(repos));
		response.end();
	};
	sendGithubRequest("/users/" + username + "/repos?type=all&sort=updated", callback);

}


// --------------------------------------------------------------------------------
//
// Name: requestRepoFile
// 
// Description: gets the plaintext file at the given path
//
// Params:  downloadUrl: 	the download_url from github that we got when we built the directory tree
// 			response: 		the response object for this server query
//
// ---------------------------------------------------------------------------------

function requestRepoFile(downloadUrl, response){

	var callback = function(error, res, body){
		response.write(body);
		response.end();
	};

	var requestOptions = {
		url:downloadUrl,
	};
	requestHandler(requestOptions, callback);	
}


// --------------------------------------------------------------------------------
//
// Name: requestRepoAnalytics
// 
// Description: gets the plaintext file at the given path
//
// Description: gets the plaintext file at the given path
//
// Params: 	owner: 		the github username of the owner of the repository as a string
//			username: 	the name of the user on github, not necessarily the owner  
//			reponame: 	the name of the repository as a string
//			repodata: 	the server call response object, this function populates the
//						following fields: 
//											commitCount
//											contributionPercentage
// 			response: 		the response object for this server query
//
//
// ---------------------------------------------------------------------------------

function requestRepoAnalytics(owner, username, reponame, repoData, response){

	var callback = function(error, res, body){	
		var contributorsArray = JSON.parse(body);

		if(!Array.isArray(contributorsArray)){  // this sometimes happens, I don't know why. Try one more time.
			sendGithubRequest("/repos/" + owner + "/" + reponame + "/stats/contributors", retryCallback);
			return;
		}

		var totalAdditionsDeletions = 0;
		var commitCount = 0;
		var additionsDeletions = 0;

		try{

			contributorsArray.forEach(function(contributor){

				var contributorAdditionsDeletions = 0;

				contributor.weeks.forEach(function(week){
					contributorAdditionsDeletions += week.a;
					contributorAdditionsDeletions += week.d;
				});

				if(contributor.author.login == username){
					commitCount = contributor.total;
					additionsDeletions = contributorAdditionsDeletions;
				}

				totalAdditionsDeletions += contributorAdditionsDeletions;
			});

		}catch(err){
			checkRateLimit(response);
			return;
		}

		repoData('commitCount',commitCount);
		if(totalAdditionsDeletions != 0)
			repoData('contributionPercentage',additionsDeletions/totalAdditionsDeletions);
		else
			repoData('contributionPercentage', 0);
		
	};

	// For some reason that I never got to the bottom of,
	// sometimes this request and ONLY this request returns an empty object with no error
	// instead of the array we wanted. This seems to happen completely randomly, and it is 
	// probably my fault somehow.. but it is non-critical data. So I try one more time and 
	// then give up (the retry usually works).

	// In future work I would actually handle this well...

	var retryCallback = function(error, res, body){
		var contributorsArray = JSON.parse(body);

		var totalAdditionsDeletions = 0;
		var commitCount = 0;
		var additionsDeletions = 0;

		
		if(!Array.isArray(contributorsArray)){  // didn't work on retry, just give up
			totalAdditionsDeletions = NaN; // flags to show we didn't get actual data
			commitCount = NaN;
		}
		else{
			try{

				contributorsArray.forEach(function(contributor){

					var contributorAdditionsDeletions = 0;

					contributor.weeks.forEach(function(week){
						contributorAdditionsDeletions += week.a;
						contributorAdditionsDeletions += week.d;
					});

					if(contributor.author.login == username){
						commitCount = contributor.total;
						additionsDeletions = contributorAdditionsDeletions;
					}

					totalAdditionsDeletions += contributorAdditionsDeletions;
				});

			}catch(err){
				checkRateLimit(response);
				return;
			}
		}
		repoData('commitCount',commitCount);
		if(totalAdditionsDeletions != 0)
			repoData('contributionPercentage',additionsDeletions/totalAdditionsDeletions);
		else
			repoData('contributionPercentage', 0);
	}

	sendGithubRequest("/repos/" + owner + "/" + reponame + "/stats/contributors", callback);
}


// --------------------------------------------------------------------------------
//
// Name: requestRepoReadme
// 
// Description: gets the plaintext file of a repository's readme
//
// Params: 	owner: 		the github username of the owner of the repository as a string
//			reponame: 	the name of the repository as a string
//			repodata: 	the server call response object, this function populates the
//						following fields: 
//											readme
// 			response: 		the response object for this server query
//
//
// ---------------------------------------------------------------------------------

function requestRepoReadme(owner, reponame, repoData, response){

	var callbackPrime = function(error, res, body){
		repoData('readme', body);
	};
	var callback = function(error, res, body){	
		// set up a request for the actual file
		var fileURL = JSON.parse(body).download_url;
		if(!fileURL){
			checkRateLimit(response);
		}
		var requestOptions = {
			url:fileURL,
		};
		requestHandler(requestOptions, callbackPrime);
	};
	sendGithubRequest("/repos/" + owner + "/" + reponame + "/readme", callback);
}

// --------------------------------------------------------------------------------
//
// Name: requestRepoFileDirectory
// 
// Description: Builds the file directory for the github repo as a tree of sorts. Also includes
//				some extra information about each file (including a raw download link) to minimize
//				API calls per repo. Because this function builds the tree recursively, the number of API calls made
//				depends on the complexity of the repository file system.
//
// Params: 	owner: 		the github username of the owner of the repository as a string
//			reponame: 	the name of the repository as a string
//			repodata: 	the server call response object, this function populates the
//						following fields: 
//											fileDirectory
// 			response: 		the response object for this server query
//
// ---------------------------------------------------------------------------------

function requestRepoFileDirectory(owner, reponame, repoData, response){

	// this.. is about to suck.
	// Note: this worked perfectly the first time I tested it and I felt cheated out
	// of the frustration I expected

	// need a closure for this hacky semaphore
	var sem = function(){
		let requestCount = 0;
		var obj = {};
		obj.openRequest = function(){
			requestCount++;
		};

		obj.closeRequest = function(){
			requestCount--;
			if(requestCount == 0){ // done recursing
				repoData('fileDirectory', directoryTree);
			}
		};
		return obj;
	}();

	// this constructor is a great reference for how the tree is structured
	// so I won't bother sketching out the object layout in a block comment
	function TreeNode(type, name, path, download){
		this.type = type;		// dir or file
		this.children = []; 	// only relevant for directories
		this.name = name;
		this.path = path;
		this.download = download; // to minimize API calls
	}

	// this is the root node, you can look at it as the root directory
	// of the project - it isn't a named directory, but it contains the first level.
	var directoryTree = new TreeNode("dir", reponame, "/");

	// kind of a recursive thing going on here..
	// because what I needed today was asynchronous recursion.
	var callback = function(error, res, body){
		
		try{
			var arr = JSON.parse(body);
			arr.forEach(function(item){
				var newNode = new TreeNode(item.type, item.name, item.path, item.download_url);
				this.children.push(newNode);
				if(item.type == "dir"){ 	// god, please forgive me for my trespasses, as I forgive those who tresspass against me
					sem.openRequest();
					sendGithubRequest("/repos/" + owner + "/" + reponame + "/contents/"+item.path, callback.bind(newNode));
				}
			}.bind(this)); // this is the parent node of this call, because of the .bind on callback
		}catch(err){
			checkRateLimit(response);
			return;
		}
		
		// it is important to decrement the semaphore AFTER the call goes out, so that we never hit 0 outstanding requests
		// in between closing and opening, when we aren't actually done yet.
		sem.closeRequest(); 
	};

	// the journey of 1000 [INSERT PREFERRED UNIT OF LENGTH HERE // default: cubits] begins with a sinpgle recursive call... - surprisingly tech savvy Confucius
	sem.openRequest();
	sendGithubRequest("/repos/" + owner + "/" + reponame + "/contents", callback.bind(directoryTree));
}

// --------------------------------------------------------------------------------
//
// Name: sendGithubRequest
// 
// Description: sends a request with the specified path to the github API, and sets a
//				callback function for the response.
//
// Params: 	path: 		the desired path for the github API (will be appended to api.github.com)
// 			callback: 	the function to be called upon receiving a response from github
//
// ---------------------------------------------------------------------------------

function sendGithubRequest(path, callback){
	var requestOptions = {
		url: GITHUB_API_URL + path,
		headers:{
			'User-Agent':'request'
		}
	};

	requestHandler(requestOptions, callback);
}

// --------------------------------------------------------------------------------
//
// Name: checkRateLimit
// 
// Description: Sometimes githubAPI just needs space. It still loves us, but it can't just
//				like.. /only/ love us.. you know? It needs to live its own life, unencumbered
//				by our needs and requests. [ 60 calls/hr unauthenticated, 5000 calls/hr authenticated]
//
//				We throw an error if we've hit the rate limit, and a slightly differently flavored
//				error otherwise (I'm a big fan of the salted caramel server error, myself...)
//
//
// ---------------------------------------------------------------------------------

function checkRateLimit(response){
	if(response.finished){
		return;
	}

	var callback = function(error, res, body){
		if(response.finished){
			return;
		}
		var obj = JSON.parse(body);
		if(obj.message.includes("rate limit exceeded")){ // salt and black pepper flavored error (we exceeded the rate limit, and also this is fairly boring)
			response.status(503); // service unavailable error
			response.write("Github Rate Limit Reached.");
			response.end();
		}
		else{ // possibly out of date milk flavored error (I don't know what's wrong, but I'm suspicious)
			response.status(500); // "fuck if I know" error
			response.write("The server took its toys and went home.");
			response.end();
		}
	};
	sendGithubRequest('/rateLimit', callback);
}