"use strict";

//----------------------------------------------
//
// previewNode.js handles 
//
//----------------------------------------------

var previewNodeManager = function(){
	const GITVIEW_URL = 'https://git-viewer.herokuapp.com/';
	const GITVIEW_TEST_URL = "http://localhost:3000/";
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

	obj.reset = function(){
		this.setNode("titleDescripFill", nodes[0]);
	};

	obj.changeLayout = function(){

	};

	obj.fillNode = function(node, type, object){
		console.log(object);
		if(node.value = "file"){
			// download the file so we can fill in the text

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function(){
				if(this.readyState == 4 && this.status == 200){
					// get the text, put in thing
					var text = JSON.parse(this.responseText);
					node.querySelector(".fileContents").innerText = text;
				}
				else{
					node.querySelector(".fileContents").innerText = "Error fetching file contents";
				}
			};
			xhttp.open("GET", GITVIEW_TEST_URL + "repo/file?downloadUrl="+object.downloadlink);
			xhttp.send();

			// set the file name
			node.querySelector(".filenameHeader").innerText = object.name;


		}else if(node.value = "fileList"){
			let ul = node.querySelector('ul');
			let li = document.createElement('li');
			li.innerText = object.name;
			li.value = object.downloadlink;
			li.onclick = function(e){
				fileExplorer.showFile(object.name, object.downloadlink);
			}
			ul.appendChild(li);


		}else if(node.value = "image"){

			node.querySelector('img').src = object.downloadlink;

		}
		

	};

	obj.setNode= function(type, node){
		var repository = getCurrentRepo();
		if(!repository)
			return;

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
				console.log('titleDescrip');
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

				// programming language
				let language = document.createElement('span');
				language.classList.add('languageInfo');
				language.innerText = "Primary Language: " + repository.language;

				node.appendChild(header);
				node.appendChild(p);
				node.appendChild(language);


				break;
			}
			case "fileFill":{
				console.log('file');
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
				console.log('file list');
				if(node.value == "fileList")
					return;
				node.value = "fileList";
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
			case "readmeFill":{
				console.log('readme');
				if(node.value == "readme")
					return;
				node.value = "readme";
				node.innerHTML = "";

				let p = document.createElement('p');
				p.innerText = repository.readme;
				p.classList.add("readme");
				node.appendChild(p);

				break;
			}
			case "contributionsFill":{
				if(node.value == "contributions")
					return;
				node.value = "contributions";

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
				contributionValue.innerText = (repository.contributionPercentage * 100) + "%";

				contributionSpan.appendChild(contributionLabel);
				contributionSpan.appendChild(contributionValue);

				node.appendChild(commitCountSpan);
				node.appendChild(contributionSpan);
				break;
			}
			case "imageFill":{
				if(node.value == "image")
					return;
				node.value = "image";
				node.innerHTML = "";

				//use the alt text to our advantage!
				let img = document.createElement('img');
				img.classList.add("nodeImage");
				img.src = "notanimage.png";
				img.alt = "Edit this node or drag and drop an image file to choose an image.";
				node.appendChild(img);
				break;
			}
			case "infoFill":{
				node.value = "link";
				node.innerHTML = "";

				// link to the repository
				let a = document.createElement('a');
				a.classList.add("repoLink");
				a.href = "https://github.com/" + repository.owner + "/" + repository.name;
				a.innerText = "Link To Repository";


				//let dates = document.createElement('span');
				//dates.classList.add('infoDates');
				// last updated


				// date generated
				node.appendChild(a);
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