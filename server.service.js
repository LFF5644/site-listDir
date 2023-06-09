const {randomBytes}=require("crypto");
const directoryTools=require("directory-tools");
const fs=require("fs");
const socketIo=require("socket.io");

const fn=()=>{}; // a function that do nothing

const dynamic={
	//clients:[],
	serverSocket: null,
};

const socketListeners={
	getFolderItems: (folder="",callback=fn)=>{
		folder=removeNotAllowed(folder);
		const items=(directoryTools.getFolderItems("public/"+folder)
			.map(item=>({
				id: randomBytes(8).toString("hex"),
				name: item.name,
				type: item.type,
			}))
		);
		console.log("items:",items);
		callback(items);
	},
};

// lib functions
function removeNotAllowed(string){
	return(string
		.split("..").join("")
		.split("\\").join("")
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
