"use strict"

const http = require('http');
const https = require('https');
const url = require('url');
const query = require('querystring');
const githubApi = require('github');
const requestHandler = require('request');
const port = process.env.PORT || process.env.NODE_PORT || 3000;

const GITHUB_API_URL = "https://api.github.com";


http.createServer((request, response) => {

  // handle errors
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });
  response.on('error', (err) => {
    console.error(err);
  });

  let parsedUrl = url.parse(request.url);
  let params = query.parse(parsedUrl.query);

  //handle requests
  switch(parsedUrl.pathname){
	case '/repo': {
	  	response.statusCode = 200;
	  	response.write('finding repo');
	  	response.end();
	  	break;
	}
	case '/user':{
	  	requestUserData(params.username,response);
	  	break;
	}
	default:{
	   	response.writeHead(200);
   		response.end('Words');
	}
  }
  
}).listen(port);

console.log("Listening on localhost:"+ port);

function requestUserData(username, response){

	

	var callback = function(error, res, body){
		response.write(JSON.stringify(body));
		response.end();
	};

	sendGithubRequest("/users/" + username + "/repos", callback);
	
}

function sendGithubRequest(path, callback){
	var requestOptions = {
		url: GITHUB_API_URL + path,
		headers:{
			'User-Agent':'request'
		}
	};

	requestHandler(requestOptions, callback);
}