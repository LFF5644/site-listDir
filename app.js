const {
	hook_effect,
	hook_memo,
	hook_model,
	init,
	node_dom,
}=window.lui;

const model={
	init:()=>({
		connected: false,
	}),
	assign:(state,object)=>({
		...state,
		...object,
	}),
};

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
	});
	hook_effect(connected=>{
		console.log("Socket has "+(connected?"connected":"disconnected")+"!");
	},[state.connected]);

	return[null,[
		node_dom("h1[innerText=Datei Explorer]",{
			S:{
				color: state.connected?"":"red",
			}
		}),
	]];
});
