const svr=this;

const fsp=require("fs/promises");
const {randomBytes}=require("crypto");


const forbiddenFolder=[
	"/files/records/",
];
const forbiddenFiles=[
	"/files/records/anrufbeantworterL3P3.wav",
];

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

async function* getFolderItems(folder="",parentFolder="public"){
	folder=removeNotAllowed(folder);
	if(!folder.endsWith("/")) folder+="/";
	if(!folder.startsWith("/")) folder="/"+folder;
	//const parentFolder="public";
	//let items=directoryTools.getFolderItems("public/"+folder);
	let items=[];
	try{
		items=await fsp.readdir(parentFolder+folder);
	}catch(e){
		items=[];
		if(e.code==="ENOENT") throw "nicht gefunden."
		log("readdir err: "+e.message);
		throw e.message;
	}
	if(forbiddenFolder.includes(folder)){
		items=[];
		log("forbidden folder: "+folder);
		throw "Verboten!";
	}

	items=items.filter(item=>!forbiddenFiles.includes(folder+item));
	items=items.filter(item=>!forbiddenFolder.some(i=>(folder+item).startsWith(i)));
	/*if(items) items=items.map(item=>({
		id: randomBytes(8).toString("hex"),
		name: item.name,
		path: item.path?item.path:(folder+item.name),
		type: item.type,
	}));*/
	for(let index=0; index<items.length; index+=1){
		const item=folder+items[index];
		log(item);
		const name=item.split("/").pop();
		let itemStats;
		try{
			itemStats=await fsp.stat(parentFolder+item);
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
		const output={
			id: randomBytes(8).toString("hex"), // shity! todo: path hash or file hash as number
			name,
			path: item,
			type,
		};
		items[index]=output;
		yield output;
	}
	items=items
		.filter(item=>item!==null)
		.sort((a,b)=>(a.type==="directory"&&b.type!=="directory")?-1:(a.type!=="directory"&&b.type==="directory")?1:a.name.localeCompare(b.name))
	//console.log("items:",items);
	return items;
}

function stop(){

}

Object.assign(svr,{
	getFolderItems,
});

return stop;