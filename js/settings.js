define([], () =>{
	let self = {
		defaults: {
			nodePhysics: true,
			direction: false,
			weights: false
		},
		current: {},
		saveSettings: function (){
			localStorage.setItem("app.settings", JSON.stringify(self.current));
		},
		loadSettings: function (){
			self.current = JSON.parse(localStorage.getItem("app.settings"));
			if(self.current === null){
				self.current = {};
			}
			self.setAll();
		},
		setAll: function (){
			network.setOptions({nodes: {physics: self.getOption("nodePhysics")}});
			network.setOptions({edges: {arrows: {to: self.getOption("direction")}}});
			if(self.getOption("weights")){
				network.setOptions({
					manipulation: {
						editEdge: {
							editWithoutDrag: main.visWeightEdgeEdit
						}
					}
				});
			}
			else{
				network.setOptions({manipulation: {editEdge: main.visOptions.manipulation.editEdge}});
			}
		},
		changeOption: function (option, value){
			self.current[option] = value;
			self.saveSettings();
			self.setAll();
		},
		getOption: function (option){
			if(option in self.current){
				return self.current[option];
			}
			return self.defaults[option];
		},
		resetToDefault: function (){
			self.current = {};
			self.saveSettings();
			self.setAll();

			// Reset graph to just a plain graph. Not sure if this should actually happen or not.
			let d = main.graphState.getGraphData();
			main.setData(main.graphState.getGraphData(main.graphState.dataSetToGraph(d.nodes, d.edges, true, false, self.defaults.direction, self.defaults.weights)));

		},
		makeSettingsPanel: function (){

		}
	};
	return self;
});
