"use strict"

const http = require('http');
const url = require('url');
const query = require('querystring');
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
	  	console.log('finding repo');
	  	response.statusCode = 200;
	  	response.write('finding repo');
	  	response.end();
	  	break;
	}
	case '/user':{
	  	console.log('getting user');
	  	requestUserData(params.username,response);
	  	break;
	}
	default:{
	  response.statusCode = 404;
	  response.end();
	}
  }
  
}).listen(port);

console.log("Listening on localhost:"+ port);

function requestUserData(username, response){

	var options = {
		host: githubAPIurl,
		path: '/users/'+username+'/repos'
	};

	var callback = function(xhrresponse){
		console.log(xhrresponse);
		response.statusCode = 200;
		response.write(xhrresponse);
  		response.end();
	};

	http.request(options,callback).end();

	response.write('getting user');
}