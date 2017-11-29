define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers", "settings", "lib/randomColor", "graphState", "dataImportExport"],
	($, gAlgo, gHelp, help, settings, randomColor, graphState, dataImpExp) =>{
		let self = {
			dataImpExp: dataImpExp,
			graphState: graphState,
			graphHelper: gHelp,
			container: document.getElementById('network'),
			visOptions: {
				interaction: {hover: true},
				manipulation: {
					addNode: function (data, callback){
						let $popup = $('#network-popUp');
						$popup.find('#operation').html("Add Node");
						$popup.find('#node-label').val(graphState.graphProperties.vertices).off("keyup")
						      .on("keyup", (e) =>{
							      if(e.key === "Enter"){
								      $("#saveButton").click();
							      }
						      });
						$popup.find('#saveButton').get(0).onclick = self.saveData.bind(this, data, callback, "add");
						$popup.find('#cancelButton').get(0).onclick = self.cancelEdit.bind(this);
						$popup.modal('show').on('shown.bs.modal', () =>{
							$("#node-label").focus();
						}).on("hidden.bs.modal", () =>{
							self.cancelEdit(callback);
						});
					},
					editNode: function (data, callback){
						let $popup = $('#network-popUp');
						$popup.find('#operation').html("Edit Node");
						$popup.find('#node-label').val(data.label).off("keyup").on("keyup", (e) =>{
							if(e.key === "Enter"){
								$("#saveButton").click();
							}
						});
						$popup.find('#saveButton')
						      .get(0).onclick = self.saveData.bind(this, data, callback, "editNode");
						$popup.find('#cancelButton').get(0).onclick = self.cancelEdit.bind(this, callback);
						$popup.modal('show').on('shown.bs.modal', () =>{
							$("#node-label").focus();
						}).on("hidden.bs.modal", () =>{
							self.cancelEdit(callback);
						});
					},
					addEdge: function (data, callback){
						let apply = function (){
							if(typeof callback === "function"){
								callback(null);
							}
							graphState.addEdge(data.from, data.to);
						};
						if(data.from === data.to){
							if(confirm("Do you want to connect the node to itself?")){
								apply();
							}
							return;
						}

						apply();
					},
					editEdge: function (data, callback) {
						if(settings.getOption("weights")){

						}
						else {
							callback(null);
							self.visOptions.manipulation.deleteEdge({edges:[data.id]});
							self.visOptions.manipulation.addEdge(data);
						}
					},
					deleteEdge: function (data, callback){
						if(typeof callback === "function"){
							callback(null);
						}
						data.edges.forEach((v) =>{
							graphState.deleteEdge(network.body.edges[v].fromId, network.body.edges[v].toId);
						});
					},
					deleteNode: function (data, callback){
						callback(null);
						data.nodes.forEach((v) =>{
							graphState.deleteNode(v);
						});
					},
				},
			},

			cancelEdit: function (callback){
				$('#network-popUp').off().modal('hide');
				if(typeof callback === "function"){
					callback(null);
				}
			},

			saveData: function (data, callback, operation){
				$('#network-popUp').modal('hide');
				data.label = document.getElementById('node-label').value;
				callback(null);

				if(operation === "add"){
					graphState.addNode(data);
				}
				else if(operation === "editNode"){
					graphState.editNode(data.id, data.label);
				}
			},

			togglePhysics: function (){
				let t = !settings.getOption("nodePhysics");
				settings.changeOption("nodePhysics", t);
			},

			toggleDirectional: function (){
				let t = !settings.getOption("direction");
				settings.changeOption("direction", t);
				let d = self.graphState.getGraphData();
				d.nodes = self.graphState.clearColorFromNodes(d.nodes);
				let newGraph = self.graphState.dataSetToGraph(d.nodes, d.edges, true, t, t, self.graphState.state.weighted);
				d = self.graphState.getGraphData(newGraph);
				self.setData(d);
			},

			toggledWeighted: function (){
				let t = !settings.getOption("weights");
				settings.changeOption("weights", t);
				let d = self.graphState.getGraphData();
				d.nodes = self.graphState.clearColorFromNodes(d.nodes);
				let newGraph = self.graphState.dataSetToGraph(d.nodes, d.edges, true, false, self.graphState.state.directed, t);
				d = self.graphState.getGraphData(newGraph);
				self.setData(d);
			},

			makeAndPrintGraphColoring: function (){
				if(settings.getOption("direction")){
					return;
				}
				let a = gAlgo.colorNetwork();

				graphState.graphProperties["Chromatic Number"] = a.chromaticNumber;
				graphState.setUpToDate(true, ["Chromatic Number"]);
				graphState.makeAndPrintProperties(false);
				graphState.setUpToDate(true, ["graphColoring"]);
				graphState.state.graphColoring = a.colors;

				let colors = help.flatten(a.colors);
				let p = "Number of Vertices: " + colors.length;
				p += "\nChromatic Number: " + a.chromaticNumber;
				p += "\n\n";

				colors.forEach((v, i) =>{
					let label = i.toString();
					if(self.graphState.state.graph.node(i).label.trim().length > 0){
						label = self.graphState.state.graph.node(i).label.trim();
					}
					p += "Vertex " + label + " gets color " + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.colors), null, 4) + "\n\n";

				p = "<h3>Graph Coloring Using Welsh-Powell Algorithm</h3><hr>" + help.htmlEncode(p);
				p += "<br/><button class='btn btn-primary' onclick='main.applyColors()'>Apply New Colors To Graph</button>";

				help.printout(p);
			},

			makeAndPrintConnectedComponents: function (){
				if(settings.getOption("direction")){
					return;
				}
				let a = gAlgo.connectedComponents();

				graphState.graphProperties["Connected Components"] = a.count;
				graphState.setUpToDate(true, ["Connected Components"]);
				graphState.makeAndPrintProperties(false);
				graphState.setUpToDate(true, ["connectedComponents"]);
				graphState.state.connectedComponents = a.components;

				let components = help.flatten(a.components);
				let p = "Number of Connected Components: " + a.count;
				p += "\n\n";

				components.forEach((v, i) =>{
					let label = i.toString();
					if(self.graphState.state.graph.node(i).label.trim().length > 0){
						label = self.graphState.state.graph.node(i).label.trim();
					}
					p += "Vertex " + label + " is in connected component #" + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

				p = "<h3>Connected Components</h3><hr>" + help.htmlEncode(p);

				help.printout(p);
			},

			makeAndPrintDirectionalEulerian: function (){
				if(!settings.getOption("direction")){
					return;
				}
				let t = gAlgo.directionalEulerian(gHelp.findVertexDegreesDirectional(graphState.state.adjacency));
				self.graphState.setUpToDate(true, ["eulerian"]);
				self.graphState.graphProperties.eulerian = t;
				self.graphState.makeAndPrintProperties();
			},

			makeAndPrintEulerian: function (){
				if(settings.getOption("direction")){
					self.makeAndPrintDirectionalEulerian();
					return;
				}

				self.graphState.setUpToDate(true, ["eulerian"]);
				self.graphState.graphProperties.eulerian = gAlgo.hasEulerianCircuit(self.graphState.state.degrees);
			},

			makeAndPrintStronglyConnectedComponents: function (){
				if(!settings.getOption("direction")){
					return;
				}
				let a = gAlgo.stronglyConnectedComponents();

				graphState.graphProperties["Strongly Connected Components"] = a.count;
				graphState.setUpToDate(true, ["Strongly Connected Components"]);
				graphState.makeAndPrintProperties(false);
				graphState.setUpToDate(true, ["stronglyConnectedComponents"]);
				graphState.state.stronglyConnectedComponents = a.components;

				let components = help.flatten(a.components);
				let p = "Number of Strongly Connected Components: " + a.count;
				p += "\n\n";

				components.forEach((v, i) =>{
					let label = i.toString();
					if(self.graphState.state.graph.node(i).label.trim().length > 0){
						label = self.graphState.state.graph.node(i).label.trim();
					}
					p += "Vertex " + label + " is in connected component #" + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

				p = "<h3>Strongly Connected Components</h3><hr>" + help.htmlEncode(p);

				help.printout(p);
			},

			makeAndPrintBFS: function (){
				if(settings.getOption("direction")){
					return;
				}
				help.showFormModal(($modal, values) =>{
						$modal.modal("hide");
						let a = gAlgo.breadthFirstSearch(parseInt(values[0]), parseInt(values[1]));

						let p = "<h3>Breadth-First Shortest Path</h3><hr>No path exists from "
							+ help.htmlEncode(values[0]) + " to " + help.htmlEncode(values[1]);

						if(a.pathExists){
							p = "Breadth-First Shortest Path From " + values[0] + " to " + values[1] + ": " + a.distance;
							p += "\n\nUsing Path: ";
							p = help.htmlEncode(p);
							a.path.forEach((v) =>{
								p += help.htmlEncode(v) + " &rarr; ";
							});
							p = p.slice(0, -8);
							p = "<h3>Breadth-First Shortest Path</h3><hr>" + p;
						}

						help.printout(p);
					},
					"Breadth-First Shortest Distance", "Go", [
						{label: "Start Node", type: "text"},
						{label: "End Node", type: "text"}
					]);
			},

			printGraphAlgorithms: function (){
				let $div = $("#algorithms-pane");
				$div.empty();
				let directional = settings.getOption("direction");
				let a = gAlgo.algorithms;
				a.forEach((alg) =>{
					if(alg.display && alg.directional === directional){
						$div.append($("<a>", {class: "nav-link", href: "#", onclick: alg.applyFunc}).text(alg.name));
					}
				});
			},

			applyColors: function (){
				if(settings.getOption("direction")){
					return;
				}
				let graphColors = graphState.getProperty("graphColoring", true);
				let chromaticNumber = graphState.getProperty("Chromatic Number", true);
				let d = graphState.getGraphData();
				let colors = randomColor({count: chromaticNumber, luminosity: "light"});
				d.nodes.forEach((v) =>{
					v.color = colors[graphColors[v.id]];
				});
				self.setData({nodes: d.nodes, edges: d.edges}, false, false);
			},

			setData: function (data, recalcProps = false, graphChanged = true, rearrangeGraph = false){
				if("directed" in data){
					settings.changeOption("direction", data.directed);
				}
				if("weighted" in data){
					settings.changeOption("weights", data.weighted);
				}
				let directional = settings.getOption("direction");
				let weighted = settings.getOption("weights");

				let g = null;
				if(rearrangeGraph){
					g = graphState.dataSetToGraph(data.nodes, data.edges, false, false, directional, weighted);
				}
				else{
					g = graphState.dataSetToGraph(data.nodes, data.edges, true, false, directional, weighted);
				}
				graphState.state.graph = g;
				graphState.state.directed = directional;
				graphState.state.weighted = weighted;

				// Set a new random seed so that the layout will be different
				self.newRandomNetworkLayout(network);

				network.setData(graphState.getGraphAsDataSet(g));
				network.disableEditMode();
				network.enableEditMode();

				if(graphChanged){
					self.printGraphAlgorithms();
					help.printout("");
					graphState.setUpToDate();
					graphState.makeAndPrintProperties(recalcProps);
				}
			},

			newRandomNetworkLayout: function (network){
				let r = Math.round(Math.random() * 1000000);
				network.layoutEngine.randomSeed = r;
				network.layoutEngine.initialRandomSeed = r;
			},

			addNetworkListeners: function (network){
				network.on("doubleClick", (p) =>{
					if("nodes" in p && p.nodes.length === 1){
						network.editNode();
					}
				});
			},

		};
		return self;
	});
