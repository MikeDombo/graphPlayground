define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers"],
	($, gAlgo, gHelp, help) => {
		let self = {
			upToDate: [
				{
					name: "Chromatic Number", upToDate: false, type: "property",
					applyFunc: () => {
						main.makeAndPrintGraphColoring();
					}
				},
				{
					name: "graphColoring", upToDate: false, type: "state",
					applyFunc: () => {
						main.makeAndPrintGraphColoring();
					}
				},
				{name: "vertices", upToDate: true, always: true, type: "property"},
				{name: "edges", upToDate: true, always: true, type: "property"},
				{
					name: "eulerian", upToDate: false, type: "property",
					applyFunc: () => {
						main.makeAndPrintEulerian();
					}
				},
				{
					name: "Connected Components", upToDate: false, type: "property",
					applyFunc: () => {
						main.makeAndPrintConnectedComponents();
					}
				},
				{
					name: "connectedComponents", upToDate: false, type: "state",
					applyFunc: () => {
						main.makeAndPrintConnectedComponents();
					}
				},
				{
					name: "Strongly Connected Components", upToDate: false, type: "property",
					applyFunc: () => {
						main.makeAndPrintStronglyConnectedComponents();
					}
				},
				{
					name: "stronglyConnectedComponents", upToDate: false, type: "state",
					applyFunc: () => {
						main.makeAndPrintStronglyConnectedComponents();
					}
				},
			],
			state: {
				graph: new jsgraphs.Graph(),
				nodes: [],
				edges: [],
				adjacency: [],
				degrees: [],
				directed: false,
				weighted: false
			},
			graphProperties: {
				vertices: 0,
				edges: 0,
				eulerian: false,
				"Chromatic Number": null,
				"Connected Components": null,
				"Strongly Connected Components": null,
			},

			setUpToDate: (value = false, listOptions) => {
				let all = listOptions === null || typeof listOptions === "undefined";
				self.upToDate.forEach((v) => {
					if((!("always" in v) || !v.always) && (all || listOptions.indexOf(v.name) > -1)){
						v.upToDate = value;
					}
				});
			},

			getProperty: (property, updateIfNotUpdated = false) => {
				let a = self.upToDate.find((v) => {
					return ("name" in v && v.name === property);
				});

				if(!a.upToDate){
					if("applyFunc" in a && updateIfNotUpdated){
						a.applyFunc();
					}
					else{
						return null;
					}
				}
				if(a.type === "state"){
					return self.state[property];
				}
				return self.graphProperties[property];
			},

			makeAndPrintProperties: (recalcLong = false) => {
				let directional = settings.getOption("direction");

				let gs = self.state;

				let d = self.getGraphData();
				gs.nodes = d.nodes;
				gs.edges = d.edges;
				self.graphProperties.vertices = gs.nodes.length;
				self.graphProperties.edges = gs.edges.length;

				gs.adjacency = gs.graph.adjList;
				gs.degrees = gHelp.findVertexDegrees(gs.adjacency);
				if(!directional){
					self.getProperty("eulerian", true);
				}

				let p = Object.keys(self.graphProperties);
				if(recalcLong){
					p.forEach((v) => {
						self.getProperty(v, true);
					});
				}

				let printableProperties = {};
				p.forEach((v) => {
					printableProperties[v] = self.getProperty(v);
				});
				self.printGraphProperties(printableProperties);
			},

			printGraphProperties: (properties) => {
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

			addEdge: (from, to, weight = 0) => {
				let d = self.getGraphData();
				d.edges.push({from: from, to: to, weight: weight});
				d.nodes = self.clearColorFromNodes(d.nodes);
				main.setData({nodes: d.nodes, edges: d.edges});
			},

			addNode: (data) => {
				let d = self.getGraphData();
				d.nodes.push({id: d.nodes.length, label: data.label, x: data.x, y: data.y});
				main.setData({nodes: d.nodes, edges: d.edges});
			},

			editNode: (id, label) => {
				self.state.graph.node(id).label = label;
				let d = self.getGraphData();
				main.setData({nodes: d.nodes, edges: d.edges}, false, false);
			},

			editEdge: (from, to, newWeight) => {
				let d = self.getGraphData();
				d.edges.forEach((v) => {
					if(v.from === from && v.to === to){
						v.weight = newWeight;
					}
				});
				main.setData({nodes: d.nodes, edges: d.edges}, false, false);
			},

			deleteEdge: (from, to) => {
				let d = self.getGraphData();
				let newEdges = [];
				d.edges.forEach((v) => {
					if(!(v.from === from && v.to === to)){
						newEdges.push(v);
					}
				});
				main.setData({nodes: d.nodes, edges: newEdges});
			},

			deleteNode: (id) => {
				let d = self.getGraphData();

				let newNodes = [];
				let nodes = d.nodes;
				nodes.forEach((v) => {
					if(v.id !== id){
						newNodes.push(v);
					}
				});
				let newEdges = [];
				let edges = d.edges;
				edges.forEach((v) => {
					if(v.from !== id && v.to !== id){
						newEdges.push(v);
					}
				});
				main.setData({nodes: newNodes, edges: newEdges}, false, true, true);
			},

			clearColorFromNodes: (nodes) => {
				nodes.forEach((v) => {
					v.color = null;
				});
				return nodes;
			},

			getGraphType: (graph) => {
				let directed = graph instanceof jsgraphs.DiGraph || graph instanceof jsgraphs.WeightedDiGraph;
				let weighted = graph instanceof jsgraphs.WeightedGraph || graph instanceof jsgraphs.FlowNetwork || graph instanceof jsgraphs.WeightedDiGraph;

				return {directed: directed, weighted: weighted};
			},

			getGraphData: (graph) => {
				let directed = false;
				let weighted = false;

				if(graph === null || typeof graph === "undefined"){
					graph = self.state.graph;
					directed = self.state.directed;
					weighted = self.state.weighted;
				}
				else{
					let t = self.getGraphType(graph);
					directed = t.directed;
					weighted = t.weighted;
				}

				let nodes = [];
				let edges = [];

				let i = 0;
				graph.nodeInfo.forEach((v) => {
					let n = {id: i++, label: v.label};

					if("color" in v && v.color !== null && typeof v.color !== "undefined"){
						n.color = v.color;
					}

					let pos = network.getPositions(n.id);
					if(typeof v.x !== "undefined" && v.x !== null){
						n.x = v.x;
					}
					else if(n.id in pos){
						n.x = pos[n.id].x;
					}
					if(typeof v.y !== "undefined" && v.y !== null){
						n.y = v.y;
					}
					else if(n.id in pos){
						n.y = pos[n.id].y;
					}

					nodes.push(n);
				});

				if("edges" in graph){
					Object.keys(graph.edges).forEach((k) => {
						let v = graph.edges[k];
						edges.push({from: v.from(), to: v.to()});
					});
				}
				else{
					graph.adjList.forEach((node) => {
						node.forEach((edge) => {
							let existingEdge = edges.find((e) => {
								return e.from === edge.v && e.to === edge.w && e.weight === edge.weight;
							});
							let repeatedEdge = edges.find((e) => {
								return e.from === edge.w && e.to === edge.v && e.weight === edge.weight;
							});

							if((typeof existingEdge === "undefined" || existingEdge.length === 0) && (directed || typeof repeatedEdge === "undefined")){
								if(typeof edge.weight === "undefined"){
									edge.weight = 0;
								}
								edges.push({from: edge.v, to: edge.w, weight: edge.weight});
							}
						});
					});
				}

				return {nodes: nodes, edges: edges, directed: directed, weighted: weighted};
			},

			nodeIDToLabel: (id, graph = self.state.graph) => {
				let n = self.getGraphData(graph).nodes;
				n = n.find((node) => {
					return node.id === id;
				});
				if(typeof n !== "undefined" && n.label.trim().length > 0){
					return n.label.trim();
				}

				return id.toString();
			},

			getGraphAsDataSet: (graph) => {
				let d = self.getGraphData(graph);
				if(d.weighted){
					d.edges.forEach((e) => {
						e.label = e.weight.toString();
					});
				}

				return {nodes: new vis.DataSet(d.nodes), edges: new vis.DataSet(d.edges)};
			},

			dataSetToGraph: (nodes, edges, keepNodePositions = false, doubleEdges = false, directional = false, weighted = false) => {
				let d = self.alignData(0, nodes, edges);
				nodes = d.nodes;
				edges = d.edges;

				let g = new jsgraphs.Graph(nodes.length);
				if(directional && weighted){
					g = new jsgraphs.WeightedDiGraph(nodes.length);
				}
				else if(directional && !weighted){
					g = new jsgraphs.DiGraph(nodes.length);
				}
				else if(!directional && weighted){
					g = new jsgraphs.WeightedGraph(nodes.length);
				}

				edges.forEach((v) => {
					if(weighted){
						// Add weights if none exist
						if(!("weight" in v) || typeof v.weight === "undefined" || v.weight === null){
							v.weight = 1;
						}
						g.addEdge(new jsgraphs.Edge(v.from, v.to, v.weight));
						if(directional && doubleEdges){
							g.addEdge(new jsgraphs.Edge(v.to, v.from, v.weight));
						}
					}
					else{
						g.addEdge(v.from, v.to);
						if(directional && doubleEdges){
							g.addEdge(v.to, v.from);
						}
					}
				});

				nodes.forEach((v) => {
					let n = g.node(v.id);
					n.label = v.label;
					let pos = network.getPositions(v.id);
					if(keepNodePositions && v.id in pos){
						n.x = pos[v.id].x;
						n.y = pos[v.id].y;
					}
					else if(keepNodePositions){
						n.x = v.x;
						n.y = v.y;
					}
					n.color = v.color;
				});

				return g;
			},

			alignData: (start, nodes, edges) => {
				let nodeMap = {};
				let nodeCount = start;
				let newNodes = [];
				nodes.forEach((v) => {
					if(v.label === v.id.toString()){
						v.label = nodeCount.toString();
					}
					let thisNode = {id: nodeCount, label: v.label, color: v.color, x: v.x, y: v.y};
					newNodes.push(thisNode);
					nodeMap[v.id] = nodeCount++;
				});

				let newEdges = [];
				edges.forEach((v) => {
					let thisEdge = {from: nodeMap[v.from], to: nodeMap[v.to], label: v.label, weight: v.weight};
					newEdges.push(thisEdge);
				});

				return {nodes: newNodes, edges: newEdges};
			},
		};

		return self;
	});
