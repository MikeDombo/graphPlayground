import $ from 'jquery';
import vis from 'vis';
import help from './genericHelpers';
import Graph from './Graph';

let self = {
	backHistory: [],
	forwardHistory: [],
	maxHistory: 10,
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
		{
			name: "cyclic", upToDate: false, type: "property",
			applyFunc: () => {
				main.makeAndPrintIsCyclic();
			}
		},
	],
	state: {
		stronglyConnectedComponents: null,
		connectedComponents: null,
		graphColoring: null,
	},
	graph: null,
	graphProperties: {
		vertices: 0,
		edges: 0,
		eulerian: false,
		"Chromatic Number": null,
		"Connected Components": null,
		"Strongly Connected Components": null,
		cyclic: false,
	},

	setUpToDate: (value = false, listOptions) => {
		let all = listOptions === null || typeof listOptions === "undefined";
		let property = false;
		self.upToDate.forEach((v) => {
			if((!("always" in v) || !v.always) && (all || listOptions.indexOf(v.name) > -1)){
				v.upToDate = value;
				if(v.type === "property"){
					property = true;
				}
			}
		});
		if(property){
			self.makeAndPrintProperties();
		}
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

		self.graphProperties.vertices = self.graph.getNumberOfNodes();
		self.graphProperties.edges = self.graph.getNumberOfEdges();

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

	addEdge: (from, to, weight = 0, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.addEdge(from, to, weight);

		let n = graph.getAllNodes();
		n = self.clearColorFromNodes(n);
		main.setData({nodes: n, edges: graph.getAllEdges()});
	},

	addNode: (data, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.addNode({label: data.label, x: data.x, y: data.y});
		main.setData(self.getGraphData(graph));
	},

	editNode: (id, label, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.editNode(id, {label: label});
		main.setData(self.getGraphData(graph), false, false);
	},

	editEdge: (from, to, newWeight, oldWeight, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.editEdge(from, to, newWeight, oldWeight);
		main.setData(self.getGraphData(graph), false, false);
	},

	deleteEdge: (from, to, weight = null, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.deleteEdge(from, to, weight, false);
		main.setData(self.getGraphData(graph));
	},

	deleteNode: (id, graph = self.graph) => {
		graph = self.getNewGraph();
		graph.deleteNode(id);
		main.setData(self.getGraphData(graph));
	},

	clearColorFromNodes: (nodes) => {
		nodes.forEach((v) => {
			v.color = null;
		});
		return nodes;
	},

	nodeIDToLabel: (id, graph = self.graph) => {
		let n = graph.getAllNodes();
		n = n.find((node) => {
			return node.id === id;
		});
		if(typeof n !== "undefined" && n.label.trim().length > 0){
			return n.label.trim();
		}

		return id.toString();
	},

	// Preferentially search by ID, label, and case-insensitive label
	nodeLabelToID: (label, graph = self.graph) => {
		let n = graph.getAllNodes();
		n = n.filter((node) => {
			return node.label.toLowerCase() === label.toLowerCase() || node.id.toString() === label;
		});

		if(n.length === 0){
			return -1;
		}
		else if(n.length === 1){
			return n[0].id;
		}

		let rID = -1;
		let found = false;

		n.forEach((node) => {
			if(!found && node.id.toString() === label){
				rID = node.id;
				found = true;
			}
		});

		if(found){
			return rID;
		}

		n.forEach((node) => {
			if(!found && node.label === label){
				rID = node.id;
				found = true;
			}
		});

		if(found){
			return rID;
		}

		n.forEach((node) => {
			if(!found && node.label.toLowerCase() === label.toLowerCase()){
				rID = node.id;
				found = true;
			}
		});

		return rID;
	},

	// Return graph as a Vis compatible dataset
	getGraphAsDataSet: (graph) => {
		let d = self.getGraphData(self.getNewGraph(graph));
		if(graph.isWeighted()){
			d.edges.forEach((e) => {
				e.label = e.weight.toString();
			});
		}

		return {nodes: new vis.DataSet(d.nodes), edges: new vis.DataSet(d.edges)};
	},

	// Clones the graph and returns the new one
	getNewGraph: (graph = self.graph) => {
		graph = graph.clone();
		return graph;
	},

	setLocations: (locations, graph = self.graph) => {
		Object.keys(locations).forEach((i) => {
			let v = locations[i];
			graph.editNode(i, {x: v.x, y: v.y});
		});
	},

	getGraphData: (graph = self.graph) => {
		return {
			nodes: graph.getAllNodes(),
			edges: graph.getAllEdges(),
			directed: graph.isDirected(),
			weighted: graph.isWeighted()
		};
	},

	// return graph object built from input nodes and edges
	dataSetToGraph: (nodes, edges, doubleEdges = false, directional = false, weighted = false) => {
		let d = self.alignData(0, nodes, edges);
		let g = new Graph(d.nodes.length, null, directional, weighted);

		d.nodes.forEach((n) => {
			g.editNode(n.id, {label: n.label, color: n.color, x: n.x, y: n.y});
		});

		d.edges.forEach((edge) => {
			g.addEdge(edge.from, edge.to, edge.weight);
		});

		return g;
	},

	// Align ID's of nodes to a start value (typically 0)
	alignData: (start, nodes, edges) => {
		let nodeMap = {};
		let nodeCount = start;
		let newNodes = [];
		nodes.forEach((v) => {
			let label = v.label;
			if(v.label === v.id.toString()){
				label = nodeCount.toString();
			}
			let thisNode = {id: nodeCount, label: label, color: v.color, x: v.x, y: v.y};
			newNodes.push(thisNode);
			nodeMap[v.id] = nodeCount++;
		});

		let newEdges = [];
		edges.forEach((v) => {
			let thisEdge = {from: nodeMap[v.from], to: nodeMap[v.to], label: v.label, weight: v.weight};
			newEdges.push(thisEdge);
		});

		return help.deepFreeze({nodes: newNodes, edges: newEdges});
	},
};

export default self;
