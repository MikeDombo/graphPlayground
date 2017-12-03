define([], () => {
	let self = {
		defaults: {
			nodePhysics: true,
			direction: false,
			weights: false
		},
		current: {},

		checkForLocalStorage: () => {
			try {
				let x = '__storage_test__';
				localStorage.setItem(x, x);
				localStorage.removeItem(x);
				return true;
			}
			catch(e) {
				return false;
			}
		},

		saveSettings: () => {
			if(self.checkForLocalStorage()){
				localStorage.setItem("app.settings", JSON.stringify(self.current));
			}
		},

		loadSettings: () => {
			if(self.checkForLocalStorage()){
				self.current = JSON.parse(localStorage.getItem("app.settings"));
			}
			if(self.current === null){
				self.current = {};
			}
			self.setAll();
		},

		setAll: () => {
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

		changeOption: (option, value) => {
			self.current[option] = value;
			self.saveSettings();
			self.setAll();
		},

		getOption: (option) => {
			if(option in self.current){
				return self.current[option];
			}
			return self.defaults[option];
		},

		resetToDefault: () => {
			self.current = {};
			self.saveSettings();
			self.setAll();

			// Reset graph to just a plain graph. Not sure if this should actually happen or not.
			let d = main.graphState.getGraphData();
			main.setData(main.graphState.getGraphData(main.graphState.dataSetToGraph(d.nodes, d.edges, false, self.defaults.direction, self.defaults.weights)));

		}
	};
	return self;
});
