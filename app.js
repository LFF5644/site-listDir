const {
	hook_effect,
	hook_memo,
	hook_model,
	init,
	node_dom,
	node_map,
	node,
}=window.lui;

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

// Views
// View: Explorer
function ViewExplorer({state,actions}){return[
	node_dom("p[style=cursor:pointer]",{
		innerText:"Verzeichnis: "+state.path,
		onclick:()=>{
			const newPath=prompt("Neues Verzeichnis: ",state.path);
			actions.assign({
				path: newPath===null?state.path:newPath,
			});
		}
	}),

	state.pathItems&&
	node_dom("ul",null,[
		node_map(ExplorerItem,state.pathItems,{state,actions}),
	]),
	
	!state.pathItems&&
	!state.pathItems_waitFor&&
	node_dom("h3[innerText=Verzeichnis nicht gefunden!][style=color:red]"),

	!state.pathItems&&
	state.pathItems_waitFor&&
	node_dom("h3[innerText=Warte auf Server ...][style=color:orange]"),
]}
function ExplorerItem({I,state,actions}){return[ // component, map: Explorer Items
	node_dom("li",null,[
		node_dom("a",{
			innerText: I.name,
			onclick:(
				I.type==="directory"
				?	()=> actions.assign({path: state.path+I.name})
				:	()=> window.open(location.protocol+"//"+location.host+state.path+I.name)
			),
		}),
	]),
]}

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
