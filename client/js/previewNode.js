"use strict";

//----------------------------------------------
//
// previewNode.js handles 
//
//----------------------------------------------

var previewNodeManager = function(){
	var obj = {};
	var nodes = [];
	var dropdown = undefined;

	obj.initialize = function(){
		nodes = document.querySelectorAll(".previewNode");
		dropdown = document.querySelector("#dropdown");

		var dropdownOptions = dropdown.querySelectorAll('li');
		dropdownOptions.forEach(function(option){
			option.onclick = function(){
				obj.setNode(this.id, nodes[dropdown.value.substr(1) - 1]);
			};
		});
	};

	obj.reset = function(){
		this.setNode("titleDescripFill", nodes[0]);
	};

	obj.changeLayout = function(){

	};

	obj.fillNode = function(){
		
		

	};

	obj.setNode= function(type, node){
		var repository = getCurrentRepo();
		switch(type){
			case "titleFill":{
				if(node.value == "title") // don't bother clobbering if no change
					return;
				node.value = "title";
				node.innerHTML = ""; // clear the inside of the node

				// create the title
				let header = document.createElement('header');
				header.classList.add("repoName");
				header.innerText = repository.name;

				node.appendChild(header);
				break;
			}
			case "titleDescripFill":{
				if(node.value == "titleDescrip")
					return;
				node.value = "titleDescrip";
				node.innerHTML = ""; 

				// title
				let header = document.createElement('header');
				header.classList.add("repoName");
				header.innerText = repository.name;

				// description
				let p = document.createElement('p');
				p.classList.add("repoDescrip");

				// check to make sure that the repository has a description on github
				// (the API will return null for the description otherwise)
				if(repository.description != "null") 
					p.innerText = repository.description;
				else
					p.innerText = "No description provided"

				break;
			}
			case "fileFill":{
				if(node.value == "file")
					return;
				node.value = "file";
				node.innerHTML = "";

				// make a place for the file to go, eventually
				// needs a file name (kind of like a title)
				// and line numbers
				// and text (to be monospaced)

				let header = document.createElement('header');
				header.classList.add('filenameHeader');
				header.innerText = "filename.extension"
				node.appendChild(header);

				// now for the code
				let pre = document.createElement('pre');
				let code = document.createElement('code');
				pre.appendChild(code);
				pre.classList.add('fileContents');
				code.innerText = "// file contents go here";
				node.appendChild(pre);

				break;
			}
			case "fileListFill":{
				if(node.value == "fileList")
					return;
				node.value = "fileList";
				node.innerHTML = "";

				// need a list of files, but a lot of the building
				// needs to happen when they actually get added
				// (for example, the items need to have onclick events
				// to see the actual file contents..)

				let ul = document.createElement('ul');
				ul.classList.add("fileList");
				node.appendChild(ul);

				break;
			}
			case "readmeFill":{
				if(node.value == "readme")
					return;
				node.value = "readme";
				node.innerHTML = "";

				break;
			}
			case "contributionsFill":{
				if(node.value == "contributions")
					return;
				node.value = "contributions";

				break;
			}
			case "imageFill":{
				if(node.value == "image")
					return;
				node.value = image;
				node.innerHTML = "";

				//use the alt text to our advantage!
				let img = document.createElement('img');
				img.classList.add("nodeImage");
				img.src = "notanimage.png";
				img.alt = "Edit this node or drag and drop an image file to choose an image.";
				node.appendChild(img);
				break;
			}
			case "editNode":{
				obj.editNode(node);
			}
		}

	};

	obj.editNode = function(node){

	};


	return obj;
}();