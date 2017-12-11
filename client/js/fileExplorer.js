"use strict"

//-------------------------------------------------------
//
// 	fileExplorer.js handles the File Explorer section of the client
//
//-------------------------------------------------------

var fileExplorer = function(){

	var obj = {};
	var fileTree = undefined;			// the tree we got from the server
	var rootDir = undefined;			// the bottom-most directory...
	var fileExplorerElem = undefined;  	// the actual HTML element (is a wrapper for the part we use)
	var dirStack = [];					// use a stack structure to handle directory navigation


	// Extremely iconic icons, with the exception of the really derpy back arrow.
	const DIR_ICON = "media/directoryicon.png";
	const FILE_ICON = "media/fileicon.png";
	const UNKNOWN_ICON = "media/unknownicon.png";
	const BACK_ICON = "media/backicon.png";



	// --------------------------------------------------------------------------------
	//
	// Name: initialize
	// 
	// Description: Grabs DOM Elements. Does nothing else right now.
	//
	// ---------------------------------------------------------------------------------
	obj.initialize = function(){
		rootDir = document.querySelector("#rootDir");
		fileExplorerElem = document.querySelector("#fileExplorer")
	};



	// --------------------------------------------------------------------------------
	//
	// Name: reset
	// 
	// Description: Should be called every time the repository changes - reinitializes
	//				the file system with new data
	//
	// Params: 		fileDirectory: the file tree to use when building, from the server 
	//
	// ---------------------------------------------------------------------------------
	obj.reset = function(fileDirectory){
		fileTree = fileDirectory;
		rootDir.innerHTML = "";
		for(let i = 0; i < dirStack.length; i++){ // clear the stack
			var level = dirStack.pop();
			level.remove(); //removes from DOM
		}
		populateDirectory(fileTree.children,rootDir);


	};



	// --------------------------------------------------------------------------------
	//
	// Name: down
	// 
	// Description: Navigate down in the file-tree (farther away from root)
	//
	// ---------------------------------------------------------------------------------
	obj.down = function(directory){
		var div = document.createElement('div');
		div.classList.add('directoryDiv');
		div.style.display = "none";
		dirStack.push(div);
		populateDirectory(directory.children, div);
		addDirectoryTransition(div);

	};


	// --------------------------------------------------------------------------------
	//
	// Name: up
	// 
	// Description: Navigate up in the file-tree (closer to root)
	//
	// ---------------------------------------------------------------------------------
	obj.up = function(){
		var level = dirStack.pop();
		hideDirectoryTransition(level);
		level.remove();
	};

	// --------------------------------------------------------------------------------
	//
	// Name: showFile
	// 
	// Description: Will have different functionality in a completed project, but right now
	// 				it opens the file in a new tab. Original intention was to open it in an
	//				in-client viewport (with label, hence the name parameter)
	//
	// Params: 		name: 		the name of the file
	// 				download: 	the download link for the file
	//
	// ---------------------------------------------------------------------------------
	obj.showFile = function(name, download){
		window.open(download,'_blank');
	}


	// --------------------------------------------------------------------------------
	//
	// Name: populateDirectory
	// 
	// Description: Builds a directory in HTML and JS, for use in the file system. Hooks up event listeners
	//				and parent/child relationships for navigation, among other things (like picking icons)
	//
	//
	// Params: 		children: 	the JS objects of the directory's children (files and directories it contains)
	// 				directory: 	the directory HTML element (NOT the JS object!)
	//
	// ---------------------------------------------------------------------------------
	function populateDirectory(children, directory){

		var ul = document.createElement('ul');
		children.forEach(function(item){
			var li = document.createElement('li');
			var icon = document.createElement('img');
			var a = document.createElement('a');

			icon.width = 30;
			icon.height = 30;

			if(item.type == "dir"){
				icon.src = DIR_ICON;
				li.onclick = function(){
					obj.down(item);
				}
				a.onclick = function(e){
					e.preventDefault();
				}
				a.ondblclick = function(e){
					e.preventDefault();
				}
			}
			else if(item.type == "file"){
				icon.src = FILE_ICON;

				li.draggable = true;
				li.ondragstart = function(e){
					e.dataTransfer.setData("name", item.name);
					e.dataTransfer.setData("download", item.download);
				};

				a.onclick = function(e){
					e.preventDefault();
				}
				a.ondblclick = function(e){
				e.preventDefault(); // do not redirect for <a> tag
				obj.showFile(item.name, item.download);
			}
			}
			else{ //shouldn't ever happen, but.. life finds a way
				icon.src=UNKNOWN_ICON;
			}
			a.innerText = item.name;
			a.href = item.download;
			
			li.appendChild(icon);
			li.appendChild(a);

			ul.appendChild(li);
		});
		directory.appendChild(ul);
		
		if(dirStack.length > 0){
			// for navigating upwards
			var backButton = document.createElement("img");
			backButton.classList.add("directoryUpButton");
			backButton.src = BACK_ICON;
			backButton.width=20;
			backButton.height = 20;
			backButton.onclick = function(){
				obj.up();
			};
			directory.appendChild(backButton);
		}
		
	}


	// --------------------------------------------------------------------------------
	//
	// Name: addDirectoryTransition
	// 
	// Description: Originally, there was going to be a fairly complex visual transition
	//				for changing directories. That would have gone here.
	//
	// Params: 		domDirectory: the HTML element of the directory to navigate in to
	//
	// ---------------------------------------------------------------------------------
	function addDirectoryTransition(domDirectory){
		fileExplorerElem.appendChild(domDirectory);

		$(domDirectory).show();
	}


	// --------------------------------------------------------------------------------
	//
	// Name: hideDirectoryTransition
	// 
	// Description: Originally, there was going to be a fairly complex visual transition
	//				for changing directories. That would have gone here.
	//
	// Params: 		domDirectory: the HTML element of the directory to navigate out of
	//
	// ---------------------------------------------------------------------------------
	function hideDirectoryTransition(domDirectory){
		$(domDirectory).hide();
	}

	return obj;
}();


// emulate an actual stack implementation
// kind of dirty but I dig it
Array.prototype.peek = function(){
	return this[this.length -1];
}