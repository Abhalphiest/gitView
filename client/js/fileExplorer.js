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
	var fileExplorerElem = undefined;
	var dirStack = [];

	const DIR_ICON = "media/directoryicon.png";
	const FILE_ICON = "media/fileicon.png";
	const UNKNOWN_ICON = "media/unknownicon.png";
	const BACK_ICON = "media/backicon.png";

	obj.initialize = function(){
		rootDir = document.querySelector("#rootDir");
		fileExplorerElem = document.querySelector("#fileExplorer")
	};

	obj.reset = function(fileDirectory){
		fileTree = fileDirectory;
		rootDir.innerHTML = "";
		for(let i = 0; i < dirStack.length; i++){ // clear the stack
			var level = dirStack.pop();
			level.remove(); //removes from DOM
		}
		populateDirectory(fileTree.children,rootDir);


	};

	obj.down = function(directory){
		var div = document.createElement('div');
		div.classList.add('directoryDiv');
		div.style.display = "none";
		dirStack.push(div);
		populateDirectory(directory.children, div);
		addDirectoryTransition(div);

	};

	obj.up = function(){
		var level = dirStack.pop();
		hideDirectoryTransition(level);
		level.remove();
	};

	obj.showFile = function(name, download){
		window.open(download,'_blank');
	}

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
					console.log('clicked');
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
		console.log(dirStack.length);
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

	function addDirectoryTransition(domDirectory){
		fileExplorerElem.appendChild(domDirectory);

		$(domDirectory).show();
	}

	function hideDirectoryTransition(domDirectory){
		$(domDirectory).hide();
	}

	return obj;
}();

Array.prototype.peek = function(){
	return this[this.length -1];
}