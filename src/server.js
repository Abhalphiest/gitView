const http = require('http');
var port = process.env.PORT || process.env.NODE_PORT || 3000;

var githubAPIurl = "https://api.github.com";

http.createServer((request, response) => {
  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });
  response.on('error', (err) => {
    console.error(err);
  });
  if (request.method === 'POST' && request.url === '/echo') {
    request.pipe(response);
  } 
  else if(request.url === '/repo'){
  	console.log('finding repo');
  	response.statusCode = 200;
  	response.write('finding repo');
  	response.end();
  }
  else if(request.url === '/user'){
  	console.log('getting user');
  	requestUserData("Abhalphiest",response);
  }
  else {
    response.statusCode = 404;
    response.end();
  }
}).listen(port);

console.log("Listening on localhost:"+ port);

function requestUserData(username, response){

	var options = {
		host: githubAPIurl,
		path: '/users/'+username+'/repos'
	};

	var callback = function(response){
		console.log(response);
	};

	http.request(options,callback).end();

	response.statusCode = 200;
  	response.write('getting user');
  	response.end();
}