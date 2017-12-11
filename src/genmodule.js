"use strict";



// get our CSS and JS from the server files
// css is an array indexed by layout (see the file for the format)
// js is a script tag (plaintext string)
const css = require('./CSS.json');
const js = require('./JS.json');
const document = require('html-element').document;


// Generate an html/css module for the data

// Structure of the data coming in:
//
// nodes: an array of nodes with properties
//											index: the index of the node in the layout
//											type: what kind of content is being held
//											html: the raw html (includes repository data)
// layout: which layout to use
//

function buildModule(data){
	let exportobj = {};
	exportobj.js = js.script;

	//get our css
	const layoutCSS = css[data.layout];
	var moduleCSS = layoutCSS.general; // will be appended to..

	//create wrapper
	var gitViewModule = document.createElement('section');
	gitViewModule.id = "gitViewModule";

	data.nodes.forEach(function(node){

		// create the node
		let div = document.createElement('div');
		div.innerHTML = node.html;
		div.id = "gitViewNode"+ node.index;

		// append the individual node css
		let nodestyle = layoutCSS.nodestyles[node.index];
		moduleCSS += "#"+div.id+"{"+nodestyle+"}";

		// check to see if we already included the relevant type CSS
		// this is a switch statement to make it easy to add features
		// and functionality that I didn't get to during this project,
		// but had planned to do
		switch(node.type){
			case "title": {
				if(!moduleCSS.includes(layoutCSS.title)) //its horribly slow to check the string each time, would be better to set a bit field. but meh.
					moduleCSS += layoutCSS.title;
				break;
			}
			case "titleDescrip":{
				if(!moduleCSS.includes(layoutCSS.title))
					moduleCSS += layoutCSS.title;
				if(!moduleCSS.includes(layoutCSS.descrip))
					moduleCSS += layoutCSS.descrip;
				break;
			}
			case "file":{
				// add file show event
				div.classList.add("fileDisplay");

				if(!moduleCSS.includes(layoutCSS.file))
					moduleCSS += layoutCSS.file;

				break;
			}

			case "fileList":{
				// should loop through li elements here and add a
				// file display class.. but.. meh

				if(!moduleCSS.includes(layoutCSS.fileList))
					moduleCSS += layoutCSS.fileList;

				break;

			}

			case "readme":{
				if(!moduleCSS.includes(layoutCSS.readme))
					moduleCSS += layoutCSS.readme;

				break;
			}

			case "contributions":{
				if(!moduleCSS.includes(layoutCSS.contributions))
					moduleCSS += layoutCSS.contributions;
				
				break;
			}

			case "image":{
				if(!moduleCSS.includes(layoutCSS.image))
					moduleCSS += layoutCSS.image;
				
				break;
			}

			case "info":{
				if(!moduleCSS.includes(layoutCSS.info))
					moduleCSS += layoutCSS.info;
				
				break;
			}
		}

		gitViewModule.appendChild(div);

	});

	exportobj.html = gitViewModule.outerHTML;
	exportobj.css = moduleCSS;
	return exportobj;
}



module.exports.buildModule = buildModule;