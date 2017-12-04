"use strict"

//-------------------------------------------------------
//
// 	fileExplorer.js handles the fileExplorer section of the client
//
//-------------------------------------------------------

var fileExplorer = function(){
	var obj = {};
	var fileTree = undefined;
	var rootDir = undefined;
	var dirStack = [];

	const DIR_ICON = "media/directoryicon.png";
	const FILE_ICON = "media/fileicon.png";
	const UNKNOWN_ICON = "media/unknownicon.png";
	const BACK_ICON = "media/backicon.png";

	obj.initialize = function(){
		rootDir = document.querySelector("#rootDir");
	};

	obj.reset = function(fileDirectory){
		fileTree = fileDirectory;
		rootDir.innerHTML = "";
		for(let i = 0; i < dirStack.length - 1; i++){ // leave the first (root) level
			var level = dirStack.pop();
			level.remove(); //removes from DOM
		}
		populateDirectory(fileTree.children,rootDir);

	};

	obj.down = function(directory){
		var div = document.createElement('div');
		div.classList.add('directoryDiv');
		div.style.display = "none";
		populateDirectory(directory.children, div);
		dirStack.push(div);
		addDirectoryTransition(div);

	};

	obj.up = function(){
		var level = dirStack.pop();
		hideDirectoryAnimation(level);
		level.remove();
	};

	function populateDirectory(children, directory){

		var ul = document.createElement('ul');
		children.forEach(function(item){
			let li = document.createElement('li');
			let icon = document.createElement('img');
			let span = document.createElement('span');

			icon.width = "50px";
			icon.height = "50px"

			if(item.type == "dir"){
				icon.src = DIR_ICON;
				li.onClick = function(){
					obj.down(item);
				}
			}
			else if(item.type == "file"){
				icon.src = FILE_ICON;
			}
			else{ //shouldn't ever happen, but.. life finds a way
				icon.src=UNKNOWN_ICON;
			}
		});
		directory.appendChild(ul);

		// for navigating upwards
		var backButton = document.createElement("img");
		backButton.classList.add("directoryUpButton");
		backButton.src = BACK_ICON;
		backButton.onclick = function(){
			obj.up();
		};
		directory.appendChild(backButton);
		
	}

	function addDirectoryTransition(domDirectory){

	}

	function hideDirectoryTransition(domDirectory){

	}

	return obj;
}();

Array.prototype.peek = function(){
	return this[this.length -1];
}