define([], () => {
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
		setAll: function(){
			network.setOptions({nodes: {physics: self.getOption("nodePhysics")}});
			network.setOptions({edges: {arrows: {to: self.getOption("direction")}}});
		},
		changeOption: function (option, value){
			self.current[option] = value;
			self.saveSettings();
			self.setAll();
		},
		getOption: function(option){
			if(option in self.current){
				return self.current[option];
			}
			return self.defaults[option];
		},
		resetToDefault: function(){
			self.current = {};
			self.saveSettings();
			self.setAll();
		},
		makeSettingsPanel: function (){

		}
	};
	return self;
});
