define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers", "settings", "lib/randomColor", "graphState", "dataImportExport"],
	($, gAlgo, gHelp, help, settings, randomColor, graphState, dataImpExp) =>{
		let self = {
			dataImpExp: dataImpExp,
			graphState: graphState,
			graphHelper: gHelp,
			container: document.getElementById('network'),
			visWeightEdgeEdit: function (data, callback){
				help.showFormModal(($modal, vals) =>{
					callback(null);
					$modal.modal("hide");
					vals = parseFloat(vals[0]);
					graphState.editEdge(data.from.id, data.to.id, vals);
				}, "Edit Edge", "Save", [
					{
						type: "numeric",
						label: "Weight/Capacity",
						initialValue: parseFloat(data.label)
					}
				]);
			},
			visOptions: {
				interaction: {hover: true},
				manipulation: {
					addNode: function (data, callback){
						let $popup = help.makeFormModal("Add Node", "Save", [
							{
								type: "html",
								initialValue: "<p>Node ID: " + self.graphState.getProperty("vertices") + "</p>"
							},
							{type: "text", label: "Label", initialValue: self.graphState.getProperty("vertices")}
						]);

						$popup.on("click", ".btn-success", () =>{
							$popup.modal("hide");
							self.saveData(data, callback, "add", $popup.find("input").first().val());
						}).on("click", ".btn-cancel", () =>{
							$popup.modal("hide");
							self.cancelEdit(callback);
						}).on("hidden.bs.modal", () =>{
							$popup.remove();
							self.cancelEdit(callback);
						}).modal("show");
					},
					editNode: function (data, callback){
						let $popup = help.makeFormModal("Edit Node", "Save", [
							{
								type: "html",
								initialValue: "<p>Node ID: " + data.id + "</p>"
							},
							{type: "text", label: "Label", initialValue: data.label}
						]);

						$popup.on("click", ".btn-success", () =>{
							$popup.modal("hide");
							self.saveData(data, callback, "editNode", $popup.find("input").first().val());
						}).on("click", ".btn-cancel", () =>{
							$popup.modal("hide");
							self.cancelEdit(callback);
						}).on("hidden.bs.modal", () =>{
							$popup.remove();
							self.cancelEdit(callback);
						}).modal("show");
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
					editEdge: function (data, callback){
						callback(null);
						self.visOptions.manipulation.deleteEdge({edges: [data.id]});
						self.visOptions.manipulation.addEdge(data);
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
				if(typeof callback === "function"){
					callback(null);
				}
			},

			saveData: function (data, callback, operation, label){
				data.label = label;
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
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " gets color " + v + "\n";
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
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
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
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
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
						let source = parseInt(values[0]);
						let sink = parseInt(values[1]);
						let a = gAlgo.breadthFirstSearch(source, sink);

						let p = "<h3>Breadth-First Shortest Path</h3><hr>No path exists from "
							+ help.htmlEncode(source) + " to " + help.htmlEncode(sink);

						if(a.pathExists){
							p = "Breadth-First Shortest Path From " + self.graphState.nodeIDToLabel(source) + " to " + self.graphState.nodeIDToLabel(sink) + ": " + a.distance;
							p += "\n\nUsing Path: ";
							p = help.htmlEncode(p);
							a.path.forEach((v) =>{
								p += help.htmlEncode(self.graphState.nodeIDToLabel(v)) + " &rarr; ";
							});
							p = p.slice(0, -8);
							p = "<h3>Breadth-First Shortest Path</h3><hr>" + p;
						}

						help.printout(p);
					},
					"Breadth-First Shortest Path", "Go", [
						{label: "Start Node", type: "text"},
						{label: "End Node", type: "text"}
					]);
			},

			makeAndPrintDijkstra: function (){
				help.showFormModal(($modal, values) =>{
						$modal.modal("hide");
						let source = parseInt(values[0]);
						let sink = parseInt(values[1]);
						let a = gAlgo.dijkstraSearch(source, sink);
						if(a === false){
							return;
						}

						let p = "<h3>Dijkstra Shortest Path</h3><hr>No path exists from "
							+ help.htmlEncode(self.graphState.nodeIDToLabel(source))
							+ " to " + help.htmlEncode(self.graphState.nodeIDToLabel(sink));

						if(a.pathExists){
							p = "Dijkstra Shortest Path Total Distance From "
								+ self.graphState.nodeIDToLabel(source) + " to "
								+ self.graphState.nodeIDToLabel(sink) + ": " + a.distance;
							p += "\nWith weighted cost: " + a.cost;
							p += "\n\nUsing Path: ";
							p = help.htmlEncode(p);
							a.path.forEach((v) =>{
								p += help.htmlEncode(self.graphState.nodeIDToLabel(v)) + " &rarr; ";
							});
							p = p.slice(0, -8);
							p = "<h3>Dijkstra Shortest Path</h3><hr>" + p;
						}

						help.printout(p);
					},
					"Dijkstra Shortest Path", "Go", [
						{label: "Start Node", type: "text"},
						{label: "End Node", type: "text"}
					]);
			},

			makeAndPrintBFSP: function (){
				help.showFormModal(($modal, values) =>{
						$modal.modal("hide");
						let source = parseInt(values[0]);
						let sink = parseInt(values[1]);
						let a = gAlgo.bellmanFord(source, sink);
						if(a === false){
							return;
						}

						let p = "<h3>Bellman-Ford Shortest Path</h3><hr>No path exists from "
							+ help.htmlEncode(self.graphState.nodeIDToLabel(source))
							+ " to " + help.htmlEncode(self.graphState.nodeIDToLabel(sink));

						if(a.pathExists){
							p = "Bellman-Ford Shortest Path Total Distance From " + self.graphState.nodeIDToLabel(source)
								+ " to " + self.graphState.nodeIDToLabel(sink) + ": " + a.distance;
							p += "\nWith weighted cost: " + a.cost;
							p += "\n\nUsing Path: ";
							p = help.htmlEncode(p);
							a.path.forEach((v) =>{
								p += help.htmlEncode(self.graphState.nodeIDToLabel(v)) + " &rarr; ";
							});
							p = p.slice(0, -8);
							p = "<h3>Bellman-Ford Shortest Path</h3><hr>" + p;
						}

						help.printout(p);
					},
					"Bellman-Ford Shortest Path", "Go", [
						{label: "Start Node", type: "text"},
						{label: "End Node", type: "text"}
					]);
			},

			makeAndPrintFFMCMF: function (){
				if(!settings.getOption("direction") || !settings.getOption("weights")){
					return;
				}
				help.showFormModal(($modal, values) =>{
						$modal.modal("hide");
						let source = parseInt(values[0]);
						let sink = parseInt(values[1]);
						let a = gAlgo.fordFulkerson(source, sink);
						if(a === false){
							return;
						}

						let p = "Ford-Fulkerson MaxFlow-MinCut Max Flow From " + self.graphState.nodeIDToLabel(source)
							+ " to " + self.graphState.nodeIDToLabel(sink) + ": " + a.maxFlow;
						p += "\n\nUsing Capacities:\n\n";
						p = help.htmlEncode(p);
						a.minCut.forEach((v) =>{
							p += self.graphState.nodeIDToLabel(v.v) + "&rarr;" + self.graphState.nodeIDToLabel(v.w)
								+ " using " + v.flow + " of " + v.capacity + " \n";
						});
						p = p.trim();
						p = "<h3>Ford-Fulkerson MaxFlow-MinCut</h3><hr>" + p;

						help.printout(p);
					},
					"Ford-Fulkerson MaxFlow-MinCut", "Go", [
						{label: "Source Node", type: "text"},
						{label: "Sink Node", type: "text"}
					]);
			},

			printGraphAlgorithms: function (){
				let $div = $("#algorithms-pane");
				$div.empty();
				let directional = settings.getOption("direction");
				let weighted = settings.getOption("weights");
				let a = gAlgo.algorithms;
				a.forEach((alg) =>{
					if(!alg.display){
						return;
					}
					if(("directional" in alg && alg.directional === directional) || !("directional" in alg)){
						if(("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)){
							$div.append($("<a>", {class: "nav-link", href: "#", onclick: alg.applyFunc})
								.text(alg.name));
						}
					}
					else if(("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)){
						if(("directional" in alg && alg.directional === directional) || !("directional" in alg)){
							$div.append($("<a>", {class: "nav-link", href: "#", onclick: alg.applyFunc})
								.text(alg.name));
						}
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

			shuffleNetworkLayout: function (){
				self.setData(self.graphState.getGraphData(), false, false, true);
			},

			newRandomNetworkLayout: function (network){
				let r = Math.round(Math.random() * 1000000);
				network.layoutEngine.randomSeed = r;
				network.layoutEngine.initialRandomSeed = r;
			},

			addNetworkListeners: function (network){
				network.on("doubleClick", (p) =>{
					if(settings.getOption("weights") && "edges" in p && p.edges.length === 1){
						network.editEdgeMode();
					}
					if("nodes" in p && p.nodes.length === 1){
						network.editNode();
					}
				});
			},

		};
		return self;
	});
