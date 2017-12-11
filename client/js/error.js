"use strict";

// -----------------------------------------
//
//  error.js handles errors. It only earned its own file
//  because I once had a beautiful dream of it being more robust than this..
//
// ----------------------------------------


// --------------------------------------------------------------------------------
//
// Name: showRateLimitError
// 
// Description: A self-documenting function name if ever I saw one..
//
// ---------------------------------------------------------------------------------

function showRateLimitError(){
	let errordialog = document.querySelector("#errorDialog");
	errordialog.querySelector('header').innerText = "Github Rate Limit Reached";
	errordialog.querySelector('p').innerText = "Github API allows a maximum of 60 calls per hour for an unauthenticated user. Please wait approximately an hour before requesting more data.";
	errordialog.querySelector('button').onclick = function(e){
		errordialog.style.opacity = 0;
		setTimeout(function(){errordialog.style.display = "none";}, 200);
	};
	errordialog.style.opacity = 1;
	setTimeout(function(){errordialog.style.display = "block";}, 200);
	
	
}

// --------------------------------------------------------------------------------
//
// Name: showServerError
// 
// Description: A self-documenting function name if ever I saw one..
//
// ---------------------------------------------------------------------------------

function showServerError(errorMessage){
	let errordialog = document.querySelector("#errorDialog");
	errordialog.querySelector('header').innerText = "Git View Server Error";
	errordialog.querySelector('p').innerText = errorMessage;  // this is a bad idea, I don't even remember what I wrote
	errordialog.querySelector('button').onclick = function(e){
		errordialog.style.opacity = 0;
		setTimeout(function(){errordialog.style.display = "none";}, 200);
	};
	errordialog.style.opacity = 1;
	setTimeout(function(){errordialog.style.display = "block";}, 200);
}