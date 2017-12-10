"use strict";

function showRateLimitError(){
	let errordialog = document.querySelector("#errorDialog");
	errordialog.querySelector('header').innerText = "Github Rate Limit Reached";
	errordialog.querySelector('p').innerText = "Github API allows a maximum of 60 calls per hour for an unauthenticated user. Please wait approximately an hour before requesting more data.";
	errordialog.show();
	
}

function showServerError(errorMessage){

}