const {randomBytes}=require("crypto");
const socketIo=require("socket.io");
const fs=require("fs");

const fn=()=>{}; // a function that do nothing

const dynamic={
	//clients:[],
	serverSocket: null,
};

const socketListeners={
	getFolderItems: async(folder="",callback=fn)=>{
		folder=removeNotAllowed(folder);
		if(!folder.endsWith("/")) folder+="/";
		if(!folder.startsWith("/")) folder="/"+folder;
		const parentFolder="public";
		//let items=directoryTools.getFolderItems("public/"+folder);
		let items=[];
		try{
			items=await readdirAsync(parentFolder+folder);
		}catch(e){
			items=[];
			log("readdir err: "+e.message);
			callback(null);
			return;
		}
		/*if(items) items=items.map(item=>({
			id: randomBytes(8).toString("hex"),
			name: item.name,
			path: item.path?item.path:(folder+item.name),
			type: item.type,
		}));*/
		for(let index=0; index<items.length; index+=1){
			const item=folder+items[index];
			const name=item.split("/").pop();
			let itemStats;
			try{
				itemStats=await statAsync(parentFolder+item);
			}catch(e){
				log("stat err: "+e.message);
				items[index]=null;
				continue;
			}
			const type=Object.entries({
				blockDevice: itemStats.isBlockDevice(),
				characterDevice: itemStats.isCharacterDevice(),
				directory: itemStats.isDirectory(),
				file: itemStats.isFile(),
				socket: itemStats.isSocket(),
				symbolicLink: itemStats.isSymbolicLink(),
				other: true,
			}).find(item=>item[1]===true)[0];
			items[index]={
				id: randomBytes(8).toString("hex"),
				name,
				path: item,
				type,
			};
		}
		items=items
			.filter(item=>item!==null)
			.sort((a,b)=>(a.type==="directory"&&b.type!=="directory")?-1:(a.type!=="directory"&&b.type==="directory")?1:a.name.localeCompare(b.name))
		//console.log("items:",items);
		callback(items);
	},
};

// lib functions
function readdirAsync(...args){return new Promise((resolve,reject)=>{
	fs.readdir(...args,(error,files)=>{
		if(error){reject(error); return;}
		resolve(files);
	});
})}
function statAsync(...args){return new Promise((resolve,reject)=>{
	fs.stat(...args,(error,stat)=>{
		if(error){reject(error); return;}
		resolve(stat);
	});
})}
function removeNotAllowed(string){
	return(string
		.split("..").join("")
		.split(".\.").join("")
		.split("//").join("/")
		.split("\\").join("")
		.split("\~").join("")
		.split("~").join("")
	);
}

// service functions
function onStart(){
	dynamic.serverSocket=socketIo(46231,{cors:{origin:"*"}});
	dynamic.serverSocket.on("connect",socketOnConnect);
	dynamic.serverSocket.on("disconnect",socketOnDisconnect);
}
function onStop(){
	dynamic.serverSocket.close();
	//dynamic.serverSocket=null;
}

// socket functions
function socketOnConnect(socket){
	const id=socket.id;
	console.log(`socket "${id}" has connected!`);
	socket.onAny((action,...args)=>{
		console.log(id,action,args); // "98765 test {data:123}"
		const listener=socketListeners[action];
		if(!listener) return;
		listener(...args);
	});
}
function socketOnDisconnect(socket){
	const id=socket.id;
	console.log(`socket "${id}" has disconnected!`);
}

// add functions to service object
// this is the service object
this.start=onStart;
this.stop=onStop;
