define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers", "settings", "lib/randomColor", "graphState", "dataImportExport"],
	($, gAlgo, gHelp, help, settings, randomColor, graphState, dataImpExp) => {
		let self = {
			dataImpExp: dataImpExp,
			graphState: graphState,
			graphHelper: gHelp,
			graphAlgorithms: gAlgo,
			container: document.getElementById('network'),
			visWeightEdgeEdit: (data, callback) => {
				help.showFormModal(($modal, vals) => {
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
					addNode: function (data, callback) {
						let $popup = help.makeFormModal("Add Node", "Save", [
							{
								type: "html",
								initialValue: "<p>Node ID: " + self.graphState.getProperty("vertices") + "</p>"
							},
							{type: "text", label: "Label", initialValue: self.graphState.getProperty("vertices")}
						]);

						$popup.on("click", ".btn-success", () => {
							$popup.modal("hide");
							self.saveData(data, callback, "add", $popup.find("input").first().val());
						}).on("click", ".btn-cancel", () => {
							$popup.modal("hide");
							self.cancelEdit(callback);
						}).on("hidden.bs.modal", () => {
							$popup.remove();
							self.cancelEdit(callback);
						}).modal("show");
					},
					editNode: function (data, callback) {
						let $popup = help.makeFormModal("Edit Node", "Save", [
							{
								type: "html",
								initialValue: "<p>Node ID: " + data.id + "</p>"
							},
							{type: "text", label: "Label", initialValue: data.label}
						]);

						$popup.on("click", ".btn-success", () => {
							$popup.modal("hide");
							self.saveData(data, callback, "editNode", $popup.find("input").first().val());
						}).on("click", ".btn-cancel", () => {
							$popup.modal("hide");
							self.cancelEdit(callback);
						}).on("hidden.bs.modal", () => {
							$popup.remove();
							self.cancelEdit(callback);
						}).modal("show");
					},
					addEdge: function (data, callback) {
						let apply = function () {
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
						callback(null);
						self.visOptions.manipulation.deleteEdge({edges: [data.id]});
						self.visOptions.manipulation.addEdge(data);
					},
					deleteEdge: function (data, callback) {
						if(typeof callback === "function"){
							callback(null);
						}
						data.edges.forEach((v) => {
							graphState.deleteEdge(network.body.edges[v].fromId, network.body.edges[v].toId);
						});
					},
					deleteNode: function (data, callback) {
						callback(null);
						data.nodes.forEach((v) => {
							graphState.deleteNode(v);
						});
					},
				},
			},

			cancelEdit: (callback) => {
				if(typeof callback === "function"){
					callback(null);
				}
			},

			saveData: (data, callback, operation, label) => {
				data.label = label;
				callback(null);

				if(operation === "add"){
					graphState.addNode(data);
				}
				else if(operation === "editNode"){
					graphState.editNode(data.id, data.label);
				}
			},

			togglePhysics: () => {
				let t = !settings.getOption("nodePhysics");
				settings.changeOption("nodePhysics", t);
			},

			toggleDirectional: () => {
				let t = !settings.getOption("direction");
				settings.changeOption("direction", t);
				let d = self.graphState.getGraphData();
				d.nodes = self.graphState.clearColorFromNodes(d.nodes);
				let newGraph = self.graphState.dataSetToGraph(d.nodes, d.edges, t, t, self.graphState.state.weighted);
				d = self.graphState.getGraphData(newGraph);
				self.setData(d);
			},

			toggledWeighted: () => {
				let t = !settings.getOption("weights");
				settings.changeOption("weights", t);
				let d = self.graphState.getGraphData();
				d.nodes = self.graphState.clearColorFromNodes(d.nodes);
				let newGraph = self.graphState.dataSetToGraph(d.nodes, d.edges, false, self.graphState.state.directed, t);
				d = self.graphState.getGraphData(newGraph);
				self.setData(d);
			},

			makeAndPrintGraphColoring: () => {
				if(settings.getOption("direction")){
					return;
				}
				let a = gAlgo.colorNetwork();

				graphState.graphProperties["Chromatic Number"] = a.chromaticNumber;
				graphState.setUpToDate(true, ["Chromatic Number", "graphColoring"]);
				graphState.state.graphColoring = a.colors;

				let colors = help.flatten(a.colors);
				let p = "Number of Vertices: " + colors.length;
				p += "\nChromatic Number: " + a.chromaticNumber;
				p += "\n\n";

				colors.forEach((v, i) => {
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " gets color " + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.colors), null, 4) + "\n\n";

				p = "<h3>Graph Coloring Using Welsh-Powell Algorithm</h3><hr>" + help.htmlEncode(p);
				p += "<br/><button class='btn btn-primary' onclick='main.applyColors()'>Apply New Colors To Graph</button>";

				help.printout(p);
			},

			makeAndPrintConnectedComponents: () => {
				if(settings.getOption("direction")){
					return;
				}
				let a = gAlgo.connectedComponents();

				graphState.graphProperties["Connected Components"] = a.count;
				graphState.setUpToDate(true, ["Connected Components", "connectedComponents"]);
				graphState.state.connectedComponents = a.components;

				let components = help.flatten(a.components);
				let p = "Number of Connected Components: " + a.count;
				p += "\n\n";

				components.forEach((v, i) => {
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

				p = "<h3>Connected Components</h3><hr>" + help.htmlEncode(p);

				help.printout(p);
			},

			makeAndPrintDirectionalEulerian: () => {
				if(!settings.getOption("direction")){
					return;
				}
				let t = gAlgo.directionalEulerian(gHelp.findVertexDegreesDirectional(graphState.state.adjacency));
				self.graphState.setUpToDate(true, ["eulerian"]);
				self.graphState.graphProperties.eulerian = t;
			},

			makeAndPrintEulerian: () => {
				if(settings.getOption("direction")){
					self.makeAndPrintDirectionalEulerian();
					return;
				}

				self.graphState.setUpToDate(true, ["eulerian"]);
				self.graphState.graphProperties.eulerian = gAlgo.hasEulerianCircuit(self.graphState.state.degrees);
			},

			makeAndPrintStronglyConnectedComponents: () => {
				if(!settings.getOption("direction")){
					return;
				}
				let a = gAlgo.stronglyConnectedComponents();

				graphState.graphProperties["Strongly Connected Components"] = a.count;
				graphState.setUpToDate(true, ["Strongly Connected Components", "stronglyConnectedComponents"]);
				graphState.state.stronglyConnectedComponents = a.components;

				let components = help.flatten(a.components);
				let p = "Number of Strongly Connected Components: " + a.count;
				p += "\n\n";

				components.forEach((v, i) => {
					p += "Vertex " + self.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

				p = "<h3>Strongly Connected Components</h3><hr>" + help.htmlEncode(p);

				help.printout(p);
			},

			makeAndPrintBFS: () => {
				if(settings.getOption("direction")){
					return;
				}
				help.showFormModal(($modal, values) => {
						let source = graphState.nodeLabelToID(values[0]);
						let sink = graphState.nodeLabelToID(values[1]);
						if(source === -1 || sink === -1){
							if(source === -1){
								let add = !$modal.find("#form-modal-0").hasClass("is-invalid");
								$modal.find("#form-modal-0").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-0").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-0").removeClass("is-invalid").nextAll("div" +
									" .invalid-feedback").remove();
							}
							if(sink === -1){
								let add = !$modal.find("#form-modal-1").hasClass("is-invalid");
								$modal.find("#form-modal-1").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-1").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-1").removeClass("is-invalid").next("div .invalid-feedback")
								      .remove();
							}
							return;
						}

						$modal.modal("hide");
						let a = gAlgo.breadthFirstSearch(source, sink);

						let p = "<h3>Breadth-First Shortest Path</h3><hr>No path exists from "
							+ help.htmlEncode(source) + " to " + help.htmlEncode(sink);

						if(a.pathExists){
							p = "Breadth-First Shortest Path From " + self.graphState.nodeIDToLabel(source) + " to " + self.graphState.nodeIDToLabel(sink) + ": " + a.distance;
							p += "\n\nUsing Path: ";
							p = help.htmlEncode(p);
							a.path.forEach((v) => {
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

			makeAndPrintDijkstra: () => {
				help.showFormModal(($modal, values) => {
						let source = graphState.nodeLabelToID(values[0]);
						let sink = graphState.nodeLabelToID(values[1]);
						if(source === -1 || sink === -1){
							if(source === -1){
								let add = !$modal.find("#form-modal-0").hasClass("is-invalid");
								$modal.find("#form-modal-0").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-0").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-0").removeClass("is-invalid").nextAll("div" +
									" .invalid-feedback").remove();
							}
							if(sink === -1){
								let add = !$modal.find("#form-modal-1").hasClass("is-invalid");
								$modal.find("#form-modal-1").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-1").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-1").removeClass("is-invalid").next("div .invalid-feedback")
								      .remove();
							}
							return;
						}

						$modal.modal("hide");
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
							a.path.forEach((v) => {
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

			makeAndPrintBFSP: () => {
				help.showFormModal(($modal, values) => {
						let source = graphState.nodeLabelToID(values[0]);
						let sink = graphState.nodeLabelToID(values[1]);
						if(source === -1 || sink === -1){
							if(source === -1){
								let add = !$modal.find("#form-modal-0").hasClass("is-invalid");
								$modal.find("#form-modal-0").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-0").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-0").removeClass("is-invalid").nextAll("div" +
									" .invalid-feedback").remove();
							}
							if(sink === -1){
								let add = !$modal.find("#form-modal-1").hasClass("is-invalid");
								$modal.find("#form-modal-1").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-1").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-1").removeClass("is-invalid").next("div .invalid-feedback")
								      .remove();
							}
							return;
						}

						$modal.modal("hide");
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
							a.path.forEach((v) => {
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

			makeAndPrintFFMCMF: () => {
				if(!settings.getOption("direction") || !settings.getOption("weights")){
					return;
				}
				help.showFormModal(($modal, values) => {
						let source = graphState.nodeLabelToID(values[0]);
						let sink = graphState.nodeLabelToID(values[1]);
						if(source === -1 || sink === -1){
							if(source === -1){
								let add = !$modal.find("#form-modal-0").hasClass("is-invalid");
								$modal.find("#form-modal-0").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-0").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-0").removeClass("is-invalid").nextAll("div" +
									" .invalid-feedback").remove();
							}
							if(sink === -1){
								let add = !$modal.find("#form-modal-1").hasClass("is-invalid");
								$modal.find("#form-modal-1").addClass("is-invalid");
								if(add){
									$modal.find("#form-modal-1").after($("<div>", {class: "invalid-feedback"})
										.text("ID or label not found"));
								}
							}
							else{
								$modal.find("#form-modal-1").removeClass("is-invalid").next("div .invalid-feedback")
								      .remove();
							}
							return;
						}

						$modal.modal("hide");
						let a = gAlgo.fordFulkerson(source, sink);
						if(a === false){
							return;
						}

						let p = "Ford-Fulkerson MaxFlow-MinCut Max Flow From " + self.graphState.nodeIDToLabel(source)
							+ " to " + self.graphState.nodeIDToLabel(sink) + ": " + a.maxFlow;
						p += "\n\nUsing Capacities:\n\n";
						p = help.htmlEncode(p);
						a.minCut.forEach((v) => {
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

			makeAndPrintKruskal: () => {
				if(settings.getOption("direction") || !settings.getOption("weights")){
					return;
				}

				let a = gAlgo.kruskal();

				let p = "Kruskal's Minimum Spanning Tree Total Weight: " + a.totalWeight;
				p += "\n\nUsing Edges:\n\n";
				p = help.htmlEncode(p);
				a.mst.forEach((v) => {
					p += self.graphState.nodeIDToLabel(v.v) + "&rarr;" + self.graphState.nodeIDToLabel(v.w) + " \n";
				});
				p = p.trim();
				p = "<h3>Kruskal Minimum Spanning Tree</h3><hr>" + p;

				help.printout(p);
			},

			makeAndPrintIsCyclic: () => {
				if(!settings.getOption("direction")){
					return;
				}
				self.graphState.graphProperties.cyclic = gAlgo.isGraphCyclic();
				self.graphState.setUpToDate(true, ["cyclic"]);
			},

			makeAndTopologicalSort: () => {
				if(!settings.getOption("direction")){
					return;
				}

				let a = gAlgo.topologicalSort();

				if(a === true){
					self.graphState.graphProperties.cyclic = true;
					self.graphState.setUpToDate(true, ["cyclic"]);

					let p = "Topological sorting failed because the graph contains a cycle";
					p = "<h3>Topological Sorting Failed</h3><hr>" + p;
					help.printout(p);

					return;
				}

				let p = "Topological Sorting:\n\n";
				p = help.htmlEncode(p);
				a.forEach((v) => {
					p += self.graphState.nodeIDToLabel(v.id) + ", ";
				});
				p = p.slice(0, -2);
				p = "<h3>Topological Sorting</h3><hr>" + p;

				help.printout(p);
			},

			printGraphAlgorithms: () => {
				let $div = $("#algorithms-pane");
				$div.empty();
				let directional = settings.getOption("direction");
				let weighted = settings.getOption("weights");
				let a = gAlgo.algorithms;
				a.forEach((alg) => {
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

			applyColors: () => {
				if(settings.getOption("direction")){
					return;
				}
				let graphColors = graphState.getProperty("graphColoring", true);
				let chromaticNumber = graphState.getProperty("Chromatic Number", true);
				let d = graphState.getGraphData();
				let colors = randomColor({count: chromaticNumber, luminosity: "light"});
				d.nodes.forEach((v) => {
					v.color = colors[graphColors[v.id]];
				});
				self.setData({nodes: d.nodes, edges: d.edges}, false, false);
			},

			setData: (data, recalcProps = false, graphChanged = true, rearrangeGraph = false) => {
				// Store existing positions in the data if we're supposed to keep the layout
				if(rearrangeGraph){
					data.nodes.forEach((v) => {
						delete v.x;
						delete v.y;
					});
				}
				else{
					data.nodes.forEach((v) => {
						let pos = network.getPositions(v.id);
						if(v.id in pos){
							v.x = pos[v.id].x;
							v.y = pos[v.id].y;
						}
					});
				}

				if(graphChanged){
					self.saveState();
				}

				if("directed" in data){
					settings.changeOption("direction", data.directed);
				}
				if("weighted" in data){
					settings.changeOption("weights", data.weighted);
				}
				let directional = settings.getOption("direction");
				let weighted = settings.getOption("weights");

				let g = graphState.dataSetToGraph(data.nodes, data.edges, false, directional, weighted);

				graphState.state.graph = g;
				graphState.state.directed = directional;
				graphState.state.weighted = weighted;

				// Set a new random seed so that the layout will be different
				self.newRandomNetworkLayout(network);

				network.setData(graphState.getGraphAsDataSet(g));
				self.graphState.setLocations(network.getPositions());

				network.disableEditMode();
				network.enableEditMode();

				if(graphChanged){
					self.printGraphAlgorithms();
					help.printout("");
					graphState.setUpToDate();
					graphState.makeAndPrintProperties(recalcProps);
				}
			},

			saveState: () => {
				if(graphState.backHistory.length >= graphState.maxHistory){
					graphState.backHistory.shift();
				}

				let s = self.getStateForSaving();
				graphState.backHistory.push(s);
				graphState.forwardHistory = [];
				$(".fa-undo").parent().parent().addClass("active");
			},

			getStateForSaving: () => {
				let state = {};
				Object.keys(graphState).forEach((k) => {
					let v = graphState[k];
					if(typeof v !== "function"){
						if(typeof v !== "object"){
							state[k] = v;
						}
						else{
							if(!k.toLowerCase().includes("history")){
								state[k] = $.extend(true, Array.isArray(v) ? [] : {}, v);
							}
						}
					}
				});

				return state;
			},

			undo: () => {
				if(graphState.backHistory.length > 0){
					self.applyState(true);
				}
			},

			redo: () => {
				if(graphState.forwardHistory.length > 0){
					self.applyState(false);
				}
			},

			applyState: (undo = true) => {
				let currentState = self.getStateForSaving();

				let newState = null;
				if(undo){
					newState = graphState.backHistory.pop();
				}
				else{
					newState = graphState.forwardHistory.pop();
				}

				settings.changeOption("direction", newState.state.directed);
				settings.changeOption("weights", newState.state.weighted);

				let g = graphState.getGraphAsDataSet(newState.state.graph);

				network.setData(g);
				network.disableEditMode();
				network.enableEditMode();

				self.printGraphAlgorithms();
				help.printout("");

				Object.keys(newState).forEach((k) => {
					let v = newState[k];
					if(typeof v !== "object"){
						graphState[k] = v;
					}
					else if(!k.toLowerCase().includes("history")){
						graphState[k] = $.extend(true, Array.isArray(v) ? [] : {}, v);
					}
				});

				graphState.makeAndPrintProperties();
				if(undo){
					$(".fa-repeat").parent().parent().addClass("active");
					if(graphState.backHistory.length === 0){
						$(".fa-undo").parent().parent().removeClass("active");
					}
					graphState.forwardHistory.push(currentState);
				}
				else{
					$(".fa-undo").parent().parent().addClass("active");
					if(graphState.forwardHistory.length === 0){
						$(".fa-repeat").parent().parent().removeClass("active");
					}
					graphState.backHistory.push(currentState);
				}
			},

			shuffleNetworkLayout: () => {
				self.setData(self.graphState.getGraphData(), false, false, true);
			},

			newRandomNetworkLayout: (network) => {
				let r = Math.round(Math.random() * 1000000);
				network.layoutEngine.randomSeed = r;
				network.layoutEngine.initialRandomSeed = r;
			},

			addNetworkListeners: (network) => {
				network.on("doubleClick", (p) => {
					if(settings.getOption("weights") && "edges" in p && p.edges.length === 1){
						network.editEdgeMode();
					}
					if("nodes" in p && p.nodes.length === 1){
						network.editNode();
					}
				});

				network.on("dragEnd", () => {
					self.graphState.setLocations(network.getPositions());
				});

				// Delete nodes/edges when hit "Delete"
				let lastNetworkClickEvent = null;
				network.on('click', (event) => {
					lastNetworkClickEvent = event;
				});

				$(document).on('keyup', (key) => {
					if(key.key === "Delete" && lastNetworkClickEvent !== null){
						if($(self.container).has($(lastNetworkClickEvent.event.target)).length > 0){
							if(("edges" in lastNetworkClickEvent && lastNetworkClickEvent.edges.length === 1)
								|| ("nodes" in lastNetworkClickEvent && lastNetworkClickEvent.nodes.length === 1)){
								if($(':focus').parents(".modal").length === 0){
									network.deleteSelected();
								}
							}
						}
					}
				});

				// Undo/Redo keyboard commands
				$(document).keydown((e) => {
					if((e.which === 89 && e.ctrlKey) || (e.which === 90 && e.ctrlKey && e.shiftKey)){
						self.redo();
					}
					else if(e.which === 90 && e.ctrlKey){
						self.undo();
					}
				});

				// When clicking off of the network, remove the Delete functionality
				$(document).on("click", (e) => {
					if($(self.container).has(e.target).length === 0){
						lastNetworkClickEvent = null;
					}
				});
			},

		};
		return self;
	});
