"use strict";

//----------------------------------------------
//
// previewNode.js handles the preview part of the client, and the
// packaging of data to send to the server to create HTML/CSS/etc
//
//----------------------------------------------

var previewNodeManager = function(){

	// bad juju to have this stuff + server calls in two different files, I should have set up a better way to handle external requests
	// but this was a short, short project
	const GITVIEW_URL = 'https://git-viewer.herokuapp.com/';
	const GITVIEW_TEST_URL = "http://localhost:3000/";
	var obj = {};				// IIFE return
	var nodes = [];				// html elements
	var dropdown = undefined; 	// context menu on right click

	// --------------------------------------------------------------------------------
	//
	// Name: initialize
	// 
	// Description: Sets up the nodes in the backend, sticks on a bunch of event handlers
	//
	// ---------------------------------------------------------------------------------

	obj.initialize = function(){
		nodes = document.querySelectorAll(".previewNode");
		dropdown = document.querySelector("#dropdown");

		var dropdownOptions = dropdown.querySelectorAll('li');
		dropdownOptions.forEach(function(option){
			option.onclick = function(){
				obj.setNode(this.id, nodes[dropdown.dataset.value.substr(1) - 1]);
			};
		});

		nodes.forEach(function(node){

			// the default for dragover is to not allow dropping
			// so we simply need to completely prevent the default
			node.ondragover = function (e){
				e.preventDefault();
			}

			// when we drop a file in the node, do something about it
			node.ondrop = function(e){
				e.preventDefault();

				var name = e.dataTransfer.getData("name");
				var downloadlink = e.dataTransfer.getData("download");
				obj.fillNode(this, {name: name, link:downloadlink});
			}

			// edit on double click
			node.ondblclick = function(e){obj.editNode(this)};
		});
	};


	// --------------------------------------------------------------------------------
	//
	// Name: reset
	// 
	// Description: Returns the preview to the default setup (to be used on a repo change, for example)
	//
	// ---------------------------------------------------------------------------------

	obj.reset = function(){
		this.setNode("titleDescripFill", nodes[0]);
		this.setNode("readmeFill", nodes[1]);
		this.setNode("fileListFill", nodes[2]);
		this.setNode("contributionsFill", nodes[3]);
		this.setNode("infoFill", nodes[4]);
	};


	// --------------------------------------------------------------------------------
	//
	// Name: changeLayout
	// 
	// Description: This feature was cut with extreme prejudice.
	//
	// ---------------------------------------------------------------------------------

	obj.changeLayout = function(){

	};


	// --------------------------------------------------------------------------------
	//
	// Name: fillNode
	// 
	// Description: Adds actual content to nodes that are not auto-populated (i.e. images, file lists, etc)
	//
	// Params: 		node:   the node to fill
	// 				object: the thing to fill it with
	//
	// ---------------------------------------------------------------------------------

	obj.fillNode = function(node, object){

		if(node.dataset.value == "file"){
			// download the file so we can fill in the text

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function(){
				if(this.readyState == 4 && this.status == 200){
					// get the text, put in thing
					node.querySelector("pre").innerText = this.responseText;
				}			
				else{
					node.querySelector("pre").innerText = "Error fetching file contents";
				}
			};
			xhttp.open("GET", GITVIEW_TEST_URL + "repo/file?downloadUrl="+object.link);
			xhttp.send();

			// set the file name
			node.querySelector(".filenameHeader").innerText = object.name;


		}else if(node.dataset.value == "fileList"){
			let ul = node.querySelector('ul');
			let li = document.createElement('li');
			li.innerText = object.name;
			li.dataset.value = object.link;
			li.onclick = function(e){
				fileExplorer.showFile(object.name, object.link);
			}
			ul.appendChild(li);


		}else if(node.dataset.value == "image"){

			node.querySelector('img').src = object.link;

		}
		

	};


	// --------------------------------------------------------------------------------
	//
	// Name: setNode
	// 
	// Description: Changes the type of a node - i.e., the type of content it holds, and
	//				auto-populates when appropriate (for example, the title can be autopopulated,
	//				but an image cannot).
	//
	// Params: 		type:   the type to change to
	// 				node: 	the node to change
	//
	// ---------------------------------------------------------------------------------

	obj.setNode= function(type, node){
		var repository = getCurrentRepo();
		console.log(node);
		if(!repository)
			return;

		switch(type){


			// A title node only displays the title of the repository, nothing else

			case "titleFill":{
				if(node.dataset.value == "title") // don't bother clobbering if no change
					return;
				node.dataset.value = "title";
				node.innerHTML = ""; // clear the inside of the node

				// create the title
				let header = document.createElement('header');
				header.classList.add("repoName");
				header.innerText = repository.name;

				node.appendChild(header);
				break;
			}

			// A titleDescrip node displays the title, gitHub description (if it exists)
			// and the primary (programming) language of the repository

			case "titleDescripFill":{
				if(node.dataset.value == "titleDescrip")
					return;
				node.dataset.value = "titleDescrip";
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

				// programming language
				let language = document.createElement('span');
				language.classList.add('languageInfo');
				language.innerText = "Primary Language: " + repository.language;

				node.appendChild(header);
				node.appendChild(p);
				node.appendChild(language);


				break;
			}

			// a file node displays the contents of a single file + the file name

			case "fileFill":{
				if(node.dataset.value == "file")
					return;
				node.dataset.value = "file";
				node.innerHTML = "";

				// make a place for the file to go, eventually
				// needs a file name (kind of like a title)
				// and text (to be monospaced)
				// future plans are to use https://github.com/syntaxhighlighter/syntaxhighlighter/ to make it pretty
				// but for now it's just a <pre>

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

			// a file list node displays a list of featured files, that can be viewed 
			// with a double click

			case "fileListFill":{
				if(node.dataset.value == "fileList")
					return;
				node.dataset.value = "fileList";
				node.innerHTML = "";

				// need a list of files, but a lot of the building
				// needs to happen when they actually get added
				// (for example, the items need to have onclick events
				// to see the actual file contents..)
				let header = document.createElement('header');
				header.innerText = "Featured Files: ";
				let ul = document.createElement('ul');
				ul.classList.add("fileList");
				node.appendChild(header);
				node.appendChild(ul);

				break;
			}

			// a read me node shows the readme (the .md file is not parsed, so it may
			// be extremely ugly for complex readmes)

			case "readmeFill":{
				if(node.dataset.value == "readme")
					return;
				node.dataset.value = "readme";
				node.innerHTML = "";

				let p = document.createElement('p');
				p.innerText = repository.readme;
				p.classList.add("readme");
				node.appendChild(p);

				break;
			}

			// a contributions node gives some basic analytics about the user's
			// contributions to the repository - the number of commits and the percentage
			// of the repo that they contributed.

			case "contributionsFill":{
				if(node.dataset.value == "contributions")
					return;
				node.dataset.value = "contributions";
				node.innerHTML = "";

				// need two things - commit count and contribution percentage

				let commitCountSpan = document.createElement('span');
				commitCountSpan.classList.add('commitCount');
				let commitLabel = document.createElement('label');
				commitLabel.innerText = "Commits Made: ";
				let commitValue = document.createElement('span');
				commitValue.innerText = repository.commitCount;

				commitCountSpan.appendChild(commitLabel);
				commitCountSpan.appendChild(commitValue);

				let contributionSpan = document.createElement('span');
				contributionSpan.classList.add('contribution');
				let contributionLabel = document.createElement('label');
				contributionLabel.innerText = "Project Contribution Percentage: ";
				let contributionValue = document.createElement('span');
				contributionValue.innerText = Math.round(repository.contributionPercentage * 100) + "%";

				contributionSpan.appendChild(contributionLabel);
				contributionSpan.appendChild(contributionValue);

				node.appendChild(commitCountSpan);
				node.appendChild(contributionSpan);
				break;
			}

			// an image node just shows an image..

			case "imageFill":{
				if(node.dataset.value == "image")
					return;
				node.dataset.value = "image";
				node.innerHTML = "";

				//use the alt text to our advantage!
				let img = document.createElement('img');
				img.classList.add("nodeImage");
				img.src = "notanimage.png";
				img.alt = "Drag and drop an image file to choose an image.";
				node.appendChild(img);
				break;
			}

			// an info node only has a link to the repository currently, but it
			// should (and will) have more information after more development

			case "infoFill":{
				node.dataset.value = "info";
				node.innerHTML = "";

				// link to the repository
				let a = document.createElement('a');
				a.classList.add("repoLink");
				a.href = "https://github.com/" + repository.owner + "/" + repository.name;
				a.innerText = "Link To Repository";


				//let dates = document.createElement('span');
				//dates.classList.add('infoDates');
				// last updated and date generated
				// TO BE IMPLEMENTED

				node.appendChild(a);
				break;
			}
			case "editNode":{
				obj.editNode(node);
			}
		}

		console.log(node);
	};

	// --------------------------------------------------------------------------------
	//
	// Name: flattenNodes
	// 
	// Description: Packages nodes into JS objects to be used by the server when
	//				making code for the user.
	//
	// Params: 		moduleObj : the object to be populated by this function. Should be sealed.
	//
	// ---------------------------------------------------------------------------------

	obj.flattenNodes = function(moduleObj){

		// constructor
		function flatNode(index, node){
			this.index = index;
			this.type = node.dataset.value;
			this.html = node.innerHTML;
		}


		for(let i = 0; i < nodes.length; i++){
			moduleObj.nodes.push(new flatNode(i, nodes[i]));
		}
	};


	// --------------------------------------------------------------------------------
	//
	// Name: editNode
	// 
	// Description: This feature was cut with extreme prejudice.
	//
	// ---------------------------------------------------------------------------------

	obj.editNode = function(node){

	};


	return obj;
}();