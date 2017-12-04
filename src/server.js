"use strict"




// ----------------------------------------------------
//
// server.js contains the core of the git-viewer server
//
// ----------------------------------------------------


// imports, constant declarations, and response header

const http = require('http');
const https = require('https');
const url = require('url');
const query = require('querystring');
const requestHandler = require('request');
const port = process.env.PORT || process.env.NODE_PORT || 3000;

const GITHUB_API_URL = "https://api.github.com";


const responseHeaders = {  
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, accept",
    "access-control-max-age": 10,
    "Content-Type": "application/json"
};


//------------------------------------
//
// SERVER ENTRY POINT
//
//-------------------------------------

http.createServer((request, response) => {

  // handle errors in both requests and responses
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });
  response.on('error', (err) => {
    console.error(err);
  });


  // parse the request into a path and usable parameters
  let parsedUrl = url.parse(request.url);
  let params = query.parse(parsedUrl.query);


  response.writeHead(200, responseHeaders);
  console.log(parsedUrl.pathname);
  //handle requests
  switch(parsedUrl.pathname){


	// --------------------------------------------------------------------------------
	//
	// The /repo path requests a specific repository, with owner, user, and reponame
	// querystring parameters. The returned JSON object contains a subset of the information
	// available, namely:
	// 		Name
	//		Description
	//		ReadMe
	//		Number of Commits made by User
	//		Percentage of Total Contribution (additions + deletions vs total)
	//		File Directory Tree
	//		Last Updated Date
	//
	// ---------------------------------------------------------------------------------
	case '/repo': {  
	  	console.log('finding repo');
	  	var repoData = {
	  		name: null,
	  		description: null,
	  		readme: null,
	  		commitCount: null,
	  		contributionPercentage: null,
	  		//fileDirectory: null,
	  		lastUpdated: null
	  	};

	  	// make sure this response object is always the same format
	  	Object.seal(repoData);

	  	function setRepoData(datatype, data){
	  		repoData[datatype] = data;

	  		let completed = true;
	  		for(var property in repoData){
	  			console.log(property);
	  			console.log(repoData[property]);
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
	  	requestRepoInformation(params.owner, params.reponame, setRepoData);
	  	requestRepoAnalytics(params.owner, params.username, params.reponame, setRepoData);
	  	requestRepoReadme(params.owner, params.reponame, setRepoData);
	  	//requestRepoFileDirectory(params.owner, params.reponame, setRepoData);
	  	break;
	}


	// --------------------------------------------------------------------------------
	//
	// The /repo/file path returns a specific file from a repository, with owner, path, and reponame
	// querystring parameters. The returned JSON object contains the file as a single plaintext string.
	//
	// ---------------------------------------------------------------------------------
	case '/repo/file':{
		requestRepoFile(params.owner, params.path, params.repo);
		break;
	}	
	// --------------------------------------------------------------------------------
	//
	// The /user/repos path returns an array of all the repos the user has contributed
	// to, with a username querystring parameter.
	//
	// ---------------------------------------------------------------------------------
	case '/user/repos':{
	  	requestUserRepos(params.username,response);
	  	break;
	}
	default:{
	   	// $TODO : add instructions here
	   	var rsponseJSON = {error: "Invalid path"};
	   	response.writeHead(404, responseHeaders);
   		response.write(JSON.stringify(rsponseJSON));
   		response.end();
	}
  }
  
}).listen(port);

console.log("Listening on localhost:"+ port);

// --------------------------------------------------------------------------------
//
// Name: requestUserRepos
// 
// Description: gets only the names of all repos that the user has contributed to,
// 				sorted in order of last-updated
//
// Params: 	username: 	the github username of the user, as a string
// 			response: 	the response object for this server query
//
// ---------------------------------------------------------------------------------

function requestUserRepos(owner, response){
	
	var callback = function(error, res, body){	
		var repos = JSON.parse(body);
		var names = [];
		repos.forEach(function(repo){
			names.push(repo.name);
		});
		response.write(JSON.stringify(names));
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
// Params: 	owner: 		the github username of the owner of the repository as a string
//			repo: 		the name of the repository as a string
//			path:  		the path to the file from the root directory of the repository 
// 			response: 	the response object for this server query
//
// ---------------------------------------------------------------------------------

function requestRepoFile(username, repo, path, response){

	var callbackPrime = function(error, res, body){
		console.dir(body);
		response.write(body);
		response.end();
	};

	var callback = function(error, res, body){	
		// set up a request for the actual file
		var fileURL = JSON.parse(body).download_url;
		var requestOptions = {
			url:fileURL,
		};
		requestHandler(requestOptions, callbackPrime);
	};
	sendGithubRequest("/repos/" + owner + "/" + repo + "/contents/"+path, callback);
}


// --------------------------------------------------------------------------------
//
// Name: requestRepoInformation
// 
// Description: gets the plaintext file at the given path
//
// Params: 	owner: 		the github username of the owner of the repository as a string
//			reponame: 	the name of the repository as a string
//			repodata: 	the server call response object, this function populates the
//						following fields: 
//											name
//											description
//											lastUpdated
//
// ---------------------------------------------------------------------------------

function requestRepoInformation(owner, reponame, repoData){

	var callback = function(error, res, body){	
		// set up a request for the actual file
		var repo = JSON.parse(body);
		repoData('name', repo.name);
		repoData('lastUpdated', repo.updated_at);
		repoData('description', repo.description);
	};

	sendGithubRequest("/repos/" + owner + "/" + reponame, callback);

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
//
//
// ---------------------------------------------------------------------------------

function requestRepoAnalytics(owner, username, reponame, repoData){

	var callback = function(error, res, body){	
		var contributorsArray = JSON.parse(body);
		var totalAdditionsDeletions = 0;
		var commitCount = 0;
		var additionsDeletions = 0;

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

		repoData('commitCount',commitCount);
		if(totalAdditionsDeletions != 0)
			repoData('contributionPercentage',additionsDeletions/totalAdditionsDeletions);
		else
			repoData('contributionPercentage', 0);
		
	};

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
//
//
// ---------------------------------------------------------------------------------

function requestRepoReadme(owner, reponame, repoData){

	var callbackPrime = function(error, res, body){
		repoData('readme', body);
	};
	var callback = function(error, res, body){	
		// set up a request for the actual file
		var fileURL = JSON.parse(body).download_url;
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
// Description: Builds the file directory for the github repo as a tree of sorts
//
// Params: 	owner: 		the github username of the owner of the repository as a string
//			reponame: 	the name of the repository as a string
//			repodata: 	the server call response object, this function populates the
//						following fields: 
//											fileDirectory
//
// ---------------------------------------------------------------------------------

function requestRepoFileDirectory(owner, reponame, repoData){

	// this.. is about to suck.

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

	function TreeNode(parent, type, name, path){
		this.parent = parent;	// for upwards navigation
		this.type = type;		// dir or file
		this.children = []; 	// only relevant for directories
		this.name = name;
		this.path = path;
	}

	var directoryTree = new TreeNode(undefined, "dir", reponame, "/");

	// kind of a recursive thing going on here..
	// because what I needed today was asynchronous recursion.
	var callback = function(error, res, body){
		var arr = JSON.parse(body);
		arr.forEach(function(item){
			var newNode = new TreeNode(this, item.type, item.name, item.path);
			this.children.push(newNode);
			if(item.type == "dir"){ 	// god, please forgive me for my trespasses, as I forgive those who tresspass against me
				sem.openRequest();
				sendGithubRequest("/repos/" + owner + "/" + reponame + "/contents/"+item.path, callback.bind(newNode));
			}
		}.bind(this)); // this is the parent node of this call, because of the .bind on callback
		sem.closeRequest();
	};

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