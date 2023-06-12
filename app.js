const {
	hook_assert,
	hook_effect,
	hook_memo,
	hook_model,
	init,
	node_dom,
	node_map,
	node,
}=window.lui;

const folderIcon="/files/img/folderRED.png";
const downloadIcon="//pics.freeicons.io/uploads/icons/png/20414393001556860958-512.png"; //tmp
const fileExtensions=[
	["*.dark.css","//upload.wikimedia.org/wikipedia/commons/3/3d/CSS.3.svg"], // duplicate
	["*.old","//upload.wikimedia.org/wikipedia/commons/thumb/0/0d/User-trash.svg/1200px-User-trash.svg.png"], //tmp
	["*.old.*","//upload.wikimedia.org/wikipedia/commons/thumb/0/0d/User-trash.svg/1200px-User-trash.svg.png"], //tmp
	["*.service.js","/files/img/fileServer.png"], // tmp

	["*.api","/files/img/fileServer.png"],
	["*.bat","/files/img/fileBATCH.png"],
	["*.css","//upload.wikimedia.org/wikipedia/commons/3/3d/CSS.3.svg"], // duplicate
	["*.exe","/files/img/fileEXE.png"],
	["*.html","/files/img/fileHTML.png"],
	["*.ini","//www.freeiconspng.com/thumbs/ini-file-icon/file-ini-icon-11.png"], //tmp
	["*.js","/files/img/fileJS.png"],
	["*.json","//cdn.icon-icons.com/icons2/2107/PNG/512/file_type_light_json_icon_130455.png"], //tmp
	["*.md","https://dalirnet.gallerycdn.vsassets.io/extensions/dalirnet/rtl-markdown/0.0.10/1641721130375/Microsoft.VisualStudio.Services.Icons.Default"], //tmp
	["*.pdf","//icons.iconarchive.com/icons/papirus-team/papirus-mimetypes/512/app-pdf-icon.png"],
	["*.py","//www.pythontutorial.net/wp-content/uploads/2020/10/python-tutorial.png"], //tmp
	["*.txt","/files/img/fileTXT.png"],
	["*.xml","/files/img/fileXML.png"],
	["*.zip","/files/img/folder.png"], //tmp
];
const hiddenItems=[
	".git",
	".github",
	".vscode",
];
const previewItems={
	video:[
		"*.mp4",
	],
	img:[
		"*.gif",
		"*.ico",
		"*.jpeg",
		"*.jpg",
		"*.png",
		"*.svg",
	],
	audio:[
		"*.mp3",
		"*.wav",
	]
};

const model={
	init:()=>({
		connected: false,
		hash: unescape(location.hash.substring(1)),
		path: "/",
		pathItems_waitFor: true,
		pathItems: null,
		view: "explorer",
	}),
	assign:(state,object)=>({
		...state,
		...object,
	}),
	debugger: s=>console.log(s)?s:s,
};

// library functions
function isExtension(extensionsFromFile,hasExtention){
	if(!extensionsFromFile||!hasExtention) return false;
	if(!extensionsFromFile.startsWith(".")) extensionsFromFile="."+extensionsFromFile;

	let end=false;
	let search=hasExtention;
	let start=false;
	if(hasExtention.startsWith("*")) start=true;
	if(hasExtention.endsWith("*")) end=true;

	//debugger;

	if(start) search=search.substring(1);
	if(end) search=search.substring(0,search.length-1);

	if(start&&end) return extensionsFromFile.includes(search);
	else if(!start&&!end) return extensionsFromFile===search;

	if(start)return extensionsFromFile.endsWith(search);
	else if(end) return extensionsFromFile.startsWith(search);
}

// Views
// View: Explorer
function ViewExplorer({state,actions}){return[
	node_dom("p",null,[
		node_dom("span[innerText=Verzeichnis: ]"),
		node_dom("a",{
			innerText: state.path,
			href: location.href,
			onclick:event=>{
				event.preventDefault();
				const newPath=prompt("Neues Verzeichnis: ",state.path);
				actions.assign({
					path: newPath===null?state.path:newPath,
				});
			},
		}),
	]),

	state.pathItems&&
	state.pathItems.length>0&&
	node_dom("fieldset",null,[
		node_dom("table",null,[
			node_map(ExplorerItem,state.pathItems,{state,actions}),
		]),
	]),
	
	state.pathItems&&
	state.pathItems.length===0&&
	node_dom("h3[innerHTML=Verzeichnis ist leer]"),

	!state.pathItems&&
	!state.pathItems_waitFor&&
	node_dom("h3[innerText=Verzeichnis nicht gefunden!][style=color:red]"),

	!state.pathItems&&
	state.pathItems_waitFor&&
	node_dom("div",null,[
		node_dom("h3[innerText=Warte auf Server ...][style=color:orange]"),
		node_dom("progress"),
	]),
]}
function ExplorerItem({I,state,actions}){
	const fileExtension=I.type==="directory"?null:(
		I.name.startsWith(".")
		?	null
		:	I.name.split(".")
				.filter((item,index)=>index>0)
				.map(item=>item.toLowerCase())
				.join(".")
	);
	return[ // component, map: Explorer Items
		hook_assert(!hiddenItems.includes(I.name)),
		node_dom("tr",null,[
			node_dom("td",null,[
				node(PreviewItem,{state,I,fileExtension}),
			]),
			node_dom("td",null,[
				node_dom("a",{
					href: (
						location.protocol+"//"+location.host+
						(I.type==="directory"
						?	location.pathname+"#"+I.path
						:	I.path
						)
					),
					innerText: I.name,
					onclick:(
						I.type==="directory"
						?	event=>{
								event.preventDefault();
								actions.assign({path: I.path});
							}
						:	event=>{
								event.preventDefault();
								window.open(location.protocol+"//"+location.host+I.path);
							}
					),
				}),
			]),
			node_dom("td",null,[
				I.type!=="directory"&&
				node_dom("a",{
					download: I.name,
					href: I.path,
					innerText: "Download",
					onclick: event=>{
						const downloadName=prompt("Speichern als: ",I.name);
						if(downloadName) event.target.download=downloadName;
						else event.preventDefault();
					},
				}),
			]),
			node_dom("td",{
				innerText: I.type,
			}),
		]),
	];
}
function PreviewItem({state,I,fileExtension}){
	console.log(I.name,fileExtension);
	const previewImg=fileExtensions.find(item=>isExtension(fileExtension,item[0]));

	return[ // component, Explorer Preview Item
		fileExtension&&
		I.type!=="directory"&&
		node_dom("span",null,[
			previewItems.img.some(item=>isExtension(fileExtension,item))&&
			node_dom("img",{
				height: 16,
				src: I.path,
			}),

			previewItems.video.some(item=>isExtension(fileExtension,item))&&
			node_dom("video[muted]",{
				height: 16,
				onplay: event=> event.target.muted=true,
				onclick: event=>{event.target.currentTime=0;event.target.play()},
				src: I.path,
			}),

			previewItems.audio.some(item=>isExtension(fileExtension,item))&&
			node_dom("img[algin=top]",{
				height: 16,
				onclick: event=>{
					const img=event.target;
					const player=event.target.player;
					if(player.paused){
						player.currentTime=0;
						player.play();
					}
					else player.pause();
				},
				onload: event=>{
					const img=event.target;
					const player=new Audio(I.path);
					img.onload=null; // this function executed 1 time!
					event.target.player=player;
					const changePlayback=()=>{
						if(player.paused) img.src="/files/img/playBTN.png";
						else img.src="/files/img/pauseBTN.png";
					};
					player.onpause=changePlayback;
					player.onplay=changePlayback;
					player.onended=changePlayback;
				},
				src: "/files/img/playBTN.png",
			}),

			previewImg&&
			node_dom("img[algin=top]",{
				height: 16,
				src: previewImg[1],
			}),
		]),

		I.type==="directory"&&
		node_dom("img[algin=top]",{
			src: folderIcon,
			height: 16,
		})
	];
}

// INIT/MAIN FUNCTION
init(()=>{
	const [state,actions]=hook_model(model);

	const socket=hook_memo(()=> // connect & create socket
		io({path:"/bind/socket/listDir"})
	);

	hook_effect(()=>{
		// make vars global
		window.actions=actions;
		window.socket=socket;

		// add socket event listeners
		socket.on("connect",()=>{
			actions.assign({connected: true});
		});
		socket.on("disconnect",()=>{
			actions.assign({connected: false});
		});

		// add other event listeners
		window.onhashchange=()=>{
			actions.assign({
				hash: unescape(location.hash.substring(1)),
			});
		};

	});

	// on socket connection change
	hook_effect(connected=>{
		console.log("Socket has "+(connected?"connected":"disconnected")+"!");
	},[state.connected]);

	// on path change
	hook_effect(path=>{
		if(!path.endsWith("/")){
			actions.assign({path: path+"/"});
			return;
		}
		if(!path.startsWith("/")){
			actions.assign({path: "/"+path});
			return;
		}
		console.log("set path to: "+path);
		location.hash=path;
		actions.assign({
			pathItems_waitFor: true,
			pathItems: null,
		});

		socket.emit("getFolderItems",path,items=>{
			console.log("new path items:",items);
			actions.assign({
				pathItems_waitFor: false,
				pathItems: items,
			});
		});

	},[state.path]);

	// on hash change && view explorer
	hook_effect(hash=>{
		console.log("hash:",hash);
		if(state.path!==hash) actions.assign({path:hash});
	},[state.hash]);

	return[null,[
		node_dom("h1[innerText=Datei Explorer]",{
			S:{
				color: state.connected?"":"red",
			},
		}),

		state.view==="explorer"&&
		node(ViewExplorer,{actions,state}),
	]];
});
