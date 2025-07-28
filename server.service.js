const svr=this;

const {randomBytes}=require("crypto");

const explorer=service_require("web/listDir/explorer");

//const socketIo=require("socket.io");
//const fs=require("fs");

//const fn=()=>{}; // a function that do nothing

// const dynamic={
// 	//clients:[],
// 	serverSocket: null,
// };

// const forbiddenFolder=[
// 	"/files/records/",
// ];
// const forbiddenFiles=[
// 	"/files/records/anrufbeantworterL3P3.wav",
// ];

// const socketListeners={
// 	getFolderItems: async(folder="",callback=fn)=>{
// 		folder=removeNotAllowed(folder);
// 		if(!folder.endsWith("/")) folder+="/";
// 		if(!folder.startsWith("/")) folder="/"+folder;
// 		const parentFolder="public";
// 		//let items=directoryTools.getFolderItems("public/"+folder);
// 		let items=[];
// 		try{
// 			items=await readdirAsync(parentFolder+folder);
// 		}catch(e){
// 			items=[];
// 			log("readdir err: "+e.message);
// 			callback(null);
// 			return;
// 		}
// 		if(forbiddenFolder.includes(folder)){
// 			items=[];
// 			log("forbidden folder: "+folder);
// 			callback(null);
// 			return;
// 		}

// 		items=items.filter(item=>!forbiddenFiles.includes(folder+item));
// 		items=items.filter(item=>!forbiddenFolder.some(i=>(folder+item).startsWith(i)));
// 		/*if(items) items=items.map(item=>({
// 			id: randomBytes(8).toString("hex"),
// 			name: item.name,
// 			path: item.path?item.path:(folder+item.name),
// 			type: item.type,
// 		}));*/
// 		for(let index=0; index<items.length; index+=1){
// 			const item=folder+items[index];
// 			const name=item.split("/").pop();
// 			let itemStats;
// 			try{
// 				itemStats=await statAsync(parentFolder+item);
// 			}catch(e){
// 				log("stat err: "+e.message);
// 				items[index]=null;
// 				continue;
// 			}
// 			const type=Object.entries({
// 				blockDevice: itemStats.isBlockDevice(),
// 				characterDevice: itemStats.isCharacterDevice(),
// 				directory: itemStats.isDirectory(),
// 				file: itemStats.isFile(),
// 				socket: itemStats.isSocket(),
// 				symbolicLink: itemStats.isSymbolicLink(),
// 				other: true,
// 			}).find(item=>item[1]===true)[0];
// 			items[index]={
// 				id: randomBytes(8).toString("hex"),
// 				name,
// 				path: item,
// 				type,
// 			};
// 		}
// 		items=items
// 			.filter(item=>item!==null)
// 			.sort((a,b)=>(a.type==="directory"&&b.type!=="directory")?-1:(a.type!=="directory"&&b.type==="directory")?1:a.name.localeCompare(b.name))
// 		//console.log("items:",items);
// 		callback(items);
// 	},
// };

// lib functions
// function readdirAsync(...args){return new Promise((resolve,reject)=>{
// 	fs.readdir(...args,(error,files)=>{
// 		if(error){reject(error); return;}
// 		resolve(files);
// 	});
// })}
// function statAsync(...args){return new Promise((resolve,reject)=>{
// 	fs.stat(...args,(error,stat)=>{
// 		if(error){reject(error); return;}
// 		resolve(stat);
// 	});
// })}
// function removeNotAllowed(string){
// 	return(string
// 		.split("..").join("")
// 		.split(".\.").join("")
// 		.split("//").join("/")
// 		.split("\\").join("")
// 		.split("\~").join("")
// 		.split("~").join("")
// 	);
// }

// service functions

function onStop(){
	// stopping socket io server.
	//dynamic.serverSocket.close();
	//dynamic.serverSocket=null;

	//stopping event stream server.
	svr.running=false;
	for(const id of svr.client_ids){
		const client=svr.clients.get(id);
		client.check(false); // make the generator stop.
	}
	svr.client_ids=[];
	svr.clients.clear();check
}

// socket functions
// function socketOnConnect(socket){
// 	const id=socket.id;
// 	console.log(`socket "${id}" has connected!`);
// 	socket.onAny((action,...args)=>{
// 		console.log(id,action,args); // "98765 test {data:123}"
// 		const listener=socketListeners[action];
// 		if(!listener) return;
// 		listener(...args);
// 	});
// }
// function socketOnDisconnect(socket){
// 	const id=socket.id;
// 	console.log(`socket "${id}" has disconnected!`);
// }

// eventStream functions
async function* eventGenerator(client_id){
	const l=a=>log("Generator-"+client_id+": "+a);
	if(!svr.clients.has(client_id)) throw new Error("client not exist");
	const client=svr.clients.get(client_id);

	/*try{
		for await(const item of explorer.getFolderItems("/","public")){
			yield ["add-item",JSON.stringify(item)];
		}
	}catch(e){
		log("path err: "+e);
		yield ["sending-finish",e];
	} finally{
		yield ["sending-finish","OK"];
	}*/

	while(svr.running){
		const wait=client.wait();
		while(client.requests.length>0){
			const [request,data]=client.requests.pop();

			if(request==="get-folderItems"){
				log("data: "+data);
				try{
					for await(const item of explorer.getFolderItems(data,"public")){
						yield ["add-item",JSON.stringify(item)];
					}
				}catch(e){
					log("get folder items err: "+e);
					//console.log(e);
					yield ["sending-finish",e];
					continue;
				}
				yield ["sending-finish","OK"];

			}
		}

		if((await wait)===false) break; // waits until next tik & exits if wanted to.
	}

}
function newClient(){
	const client={
		check: null,
		feeds:[],
		id: randomBytes(8).toString("hex").substring(0,16),
		requests: [],
		wait: null,
	};
	client.wait=()=>new Promise(resolve=>{client.check=resolve});
	svr.clients.set(client.id,client);
	svr.client_ids.push(client.id);
	return client;
}
function removeClient(client){
	svr.clients.delete(client.id);
	svr.client_ids=svr.client_ids.filter(item=>item!==client.id);
}
function updateClientGenerator(request){
	for(const id of svr.client_ids){
		const client=svr.clients.get(id);
		if(request) client.requests.push(request);
		client.check(request===false?false:undefined); // stopping waiting and recheck for changes.
	}
}

// start & stop service vai new format.
svr.clients=new Map();
svr.client_ids=[];

// dynamic.serverSocket=socketIo(46231,{cors:{origin:"*"}});
// dynamic.serverSocket.on("connect",socketOnConnect);
// dynamic.serverSocket.on("disconnect",socketOnDisconnect);

svr.running=true;
Object.assign(svr,{
	newClient,
	eventGenerator,
	removeClient,
});

return onStop;
