define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers"],
	($, gAlgo, gHelp, help) =>{
		let self = {
			upToDate: [
				{name: "Chromatic Number", upToDate: false, type: "property"},
				{name: "graphColoring", upToDate: false, type: "state"},
				{name: "vertices", upToDate: true, always: true, type: "property"},
				{name: "edges", upToDate: true, always: true, type: "property"},
				{name: "eulerian", upToDate: true, always: true, type: "property"}
			],
			state: {
				nodes: [], edges: [], adjacencyRepeated: [], adjacency: [], degreesRepeated: [], degrees: [],
			},
			graphProperties: {
				vertices: 0,
				edges: 0,
				eulerian: false,
				"Chromatic Number": null
			},
			setUpToDate: function (value = false, listOptions){
				let all = listOptions === null || typeof listOptions === "undefined";
				self.upToDate.forEach((v) =>{
					if((!("always" in v) || !v.always) && (all || listOptions.indexOf(v.name) > -1)){
						v.upToDate = value;
					}
				});
			},
			getProperty: function (property){
				let a = self.upToDate.find((v) =>{
					return ("name" in v && v.name === property);
				});

				if(!a.upToDate){
					return null;
				}
				if(a.type === "state"){
					return self.state[property];
				}
				return self.graphProperties[property];
			},

			makeAndPrintProperties: function (recalcLong = false){
				let gs = self.state;

				gs.nodes = main.getNodes();
				gs.edges = main.getEdges();
				self.graphProperties.vertices = help.datasetToArray(main.getNodes()).length;
				self.graphProperties.edges = help.datasetToArray(main.getEdges()).length;
				let adj = gHelp.makeAdjacencyMatrix(main.getNodes(), main.getEdges());
				gs.adjacencyRepeated = adj.adjacencyRepeated;
				gs.adjacency = adj.adjacency;
				gs.degreesRepeated = gHelp.findVertexDegrees(adj.adjacencyRepeated);
				gs.degrees = gHelp.findVertexDegrees(adj.adjacency);

				self.graphProperties.eulerian = gAlgo.hasEulerianCircuit(gs.degreesRepeated);

				let p = Object.keys(self.graphProperties);
				if(recalcLong){
					p.forEach((v) =>{
						if(self.getProperty(v) === null){
							if(v === "Chromatic Number"){
								main.makeAndPrintGraphColoring();
							}
						}
					});
					// TODO: Hamiltonicity, diameter, girth,...
					// TODO: https://en.wikipedia.org/wiki/Graph_property#Integer_invariants
				}

				let printableProperties = {};
				p.forEach((v) =>{
					printableProperties[v] = self.getProperty(v);
				});
				self.printGraphProperties(printableProperties);
			},

			printGraphProperties: function (properties){
				let p = "";
				for(let k in properties){
					if(properties[k] !== null){
						p += help.toTitleCase(k) + ": " + properties[k] + "\n";
					}
				}
				p = p.trim();
				p = help.htmlEncode(p);
				$("#graphProps").html("<p class='nav-link'>" + p + "</p>");
			},
		};
		return self;
	});
