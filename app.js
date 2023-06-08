const {
	hook_model,
	init,
	node_dom,
}=window.lui;

const model={
	init:()=>({
		connected: false,
	}),
};

init(()=>{
	const [state,actions]=hook_model(model);
	return[null,[
		node_dom("h1[innerText=test]"),
	]];
});
