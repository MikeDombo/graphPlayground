define(["graphHelpers", "genericHelpers"], (graphH, genericH) => {
	let self = {
		algorithms: [
			{name: "Graph Coloring", directional: false, applyFunc: "main.applyColors();", display: true},
			{
				name: "Connected Components",
				directional: false,
				applyFunc: "main.makeAndPrintConnectedComponents();",
				display: true
			},
			{
				name: "Strongly Connected Components",
				directional: true,
				display: true,
				applyFunc: "main.makeAndPrintStronglyConnectedComponents();"
			},
			{
				name: "Breadth-First Shortest Path",
				directional: false,
				applyFunc: "main.makeAndPrintBFS();",
				display: true
			},
			{
				name: "Dijkstra Shortest Path",
				applyFunc: "main.makeAndPrintDijkstra();",
				display: true
			},
			{
				name: "Bellman-Ford Shortest Path",
				weighted: true,
				directional: true,
				applyFunc: "main.makeAndPrintBFSP();",
				display: true
			},
			{
				name: "Ford-Fulkerson",
				weighted: true,
				directional: true,
				applyFunc: "main.makeAndPrintFFMCMF();",
				display: true
			},
			{
				name: "Kruskal Minimum Spanning Tree",
				weighted: true,
				directional: false,
				applyFunc: "main.makeAndPrintKruskal();",
				display: true
			},
			{
				name: "Cyclic",
				applyFunc: "main.makeAndPrintIsCyclic();",
				directional: true,
				display: true
			},
			{
				name: "Topological Sort",
				applyFunc: "main.makeAndTopologicalSort();",
				directional: true,
				display: true
			},
			{name: "Eulerian", directional: false, display: false, applyFunc: null},
			{name: "Eulerian", directional: true, display: true, applyFunc: "main.makeAndPrintDirectionalEulerian();"},
		],

		colorNetwork: (graphState = main.graphState) => {
			let G = graphState.state.graph;
			let d = graphState.getGraphData(G);

			// Get an unweighted graph if ours is weighted. For some reason it doesn't work w/ weights, even though
			// it should
			if(d.weighted){
				G = graphState.dataSetToGraph(d.nodes, d.edges);
				d = graphState.getGraphData(G);
			}

			let nodes = d.nodes;
			let adjacency = G.adjList;
			let degrees = graphH.findVertexDegrees(adjacency);

			let nodeArr = genericH.datasetToArray(nodes, "id");
			// Put vertices in array in decreasing order of degree
			let vertexOrder = nodeArr.sort((a, b) => {
				return degrees[a] < degrees[b] ? 1 : degrees[a] === degrees[b] ? 0 : -1;
			});

			let colorIndex = {};
			let currentColor = 0;
			while(vertexOrder.length > 0){
				let root = vertexOrder.shift();
				colorIndex[root] = currentColor;

				let myGroup = [];
				myGroup.push(root);

				for(let i = 0; i < vertexOrder.length;){
					let p = vertexOrder[i];
					let conflict = false;

					for(let j = 0; j < myGroup.length; j++){
						if(graphH.isAdjacent(p, myGroup[j], adjacency)){
							i++;
							conflict = true;
							break;
						}
					}
					if(conflict){
						continue;
					}

					colorIndex[p] = currentColor;
					myGroup.push(p);
					vertexOrder.splice(i, 1);
				}

				currentColor++;
			}

			let chromaticNumber = genericH.max(genericH.flatten(colorIndex)) + 1;
			return {colors: colorIndex, chromaticNumber: chromaticNumber};
		},

		connectedComponents: (graphState = main.graphState) => {
			let G = graphState.state.graph;

			// If weighted, unweight it
			if(graphState.getGraphType(G).weighted){
				let d = graphState.getGraphData(G);
				G = graphState.dataSetToGraph(d.nodes, d.edges, false, false, false);
			}

			let cc = new jsgraphs.ConnectedComponents(G);
			let componentIndex = {};
			for(let v = 0; v < G.V; v++){
				componentIndex[v] = cc.componentId(v);
			}
			return {components: componentIndex, count: cc.componentCount()};
		},

		stronglyConnectedComponents: (graphState = main.graphState) => {
			let G = graphState.state.graph;

			// If weighted, unweight it
			if(graphState.getGraphType(G).weighted){
				let d = graphState.getGraphData(G);
				G = graphState.dataSetToGraph(d.nodes, d.edges, false, true, false);
			}

			let cc = new jsgraphs.StronglyConnectedComponents(G);
			let componentIndex = {};
			for(let v = 0; v < G.V; v++){
				componentIndex[v] = cc.componentId(v);
			}
			return {components: componentIndex, count: cc.componentCount()};
		},

		breadthFirstSearch: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.state.graph;

			// If weighted, unweight it
			if(graphState.getGraphType(G).weighted){
				let d = graphState.getGraphData(G);
				G = graphState.dataSetToGraph(d.nodes, d.edges, false, false, false);
			}

			let bfs = new jsgraphs.BreadthFirstSearch(G, startNodeID);

			if(bfs.hasPathTo(targetNodeID)){
				return {pathExists: true, path: bfs.pathTo(targetNodeID), distance: bfs.pathTo(targetNodeID).length};
			}

			return {pathExists: false, path: [], distance: -1};
		},

		dijkstraSearch: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.state.graph;
			let d = graphState.getGraphData(G);

			if(!d.directed){
				G = graphState.dataSetToGraph(d.nodes, d.edges, true, true, true);
			}
			else if(!d.weighted){
				G = graphState.dataSetToGraph(d.nodes, d.edges, false, true, true);
			}

			let nonNegative = graphState.getGraphData(G).edges.find((edge) => {
				return edge.weight < 0;
			});
			if(typeof nonNegative !== "undefined"){
				genericH.showErrorModal("Dijkstra Error", "<p>The Dijkstra algorithm only works on graphs" +
					" with totally non-negative edge weights. Please fix the graph so that there are no" +
					" negative edge weights.</p><p>Alternatively, try the Bellman-Ford algorithm which solves" +
					" exactly this problem.</p>");
				return false;
			}

			let dijk = new jsgraphs.Dijkstra(G, startNodeID);

			if(dijk.hasPathTo(targetNodeID)){
				let path = [];
				dijk.pathTo(targetNodeID).forEach((edge) => {
					if(!path.includes(edge.v)){
						path.push(edge.v);
					}
					path.push(edge.w);
				});
				return {
					pathExists: true,
					path: path,
					distance: dijk.pathTo(targetNodeID).length,
					cost: dijk.distanceTo(targetNodeID)
				};
			}

			return {pathExists: false, path: [], distance: -1, cost: 0};
		},

		bellmanFord: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.state.graph;

			let bellmanF = new jsgraphs.BellmanFord(G, startNodeID);

			if(bellmanF.hasPathTo(targetNodeID)){
				let path = [];
				bellmanF.pathTo(targetNodeID).forEach((edge) => {
					if(!path.includes(edge.v)){
						path.push(edge.v);
					}
					path.push(edge.w);
				});
				return {
					pathExists: true,
					path: path,
					distance: bellmanF.pathTo(targetNodeID).length,
					cost: bellmanF.distanceTo(targetNodeID)
				};
			}

			return {pathExists: false, path: [], distance: -1, cost: 0};
		},

		fordFulkerson: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.state.graph;

			let d = graphState.getGraphData(G);
			G = new jsgraphs.FlowNetwork(d.nodes.length);
			let error = false;
			d.edges.forEach((edge) => {
				if(edge.weight < 0){
					error = true;
				}
				G.addEdge(new jsgraphs.FlowEdge(edge.from, edge.to, edge.weight));
			});

			if(error){
				genericH.showErrorModal("Ford-Fulkerson Error", "<p>The Ford-Fulkerson algorithm only works on graphs" +
					" with totally non-negative capacities. Please fix the graph so that there are no" +
					" negative capacities.</p>");
				return false;
			}

			let fordFulk = new jsgraphs.FordFulkerson(G, startNodeID, targetNodeID);

			return {maxFlow: fordFulk.value, minCut: fordFulk.minCut(G)};
		},

		kruskal: (graphState = main.graphState) => {
			let G = graphState.state.graph;

			let kruskal = new jsgraphs.KruskalMST(G).mst;
			let weight = kruskal.reduce((acc, e) => {
				return acc + e.weight;
			}, 0);

			return {mst: kruskal, totalWeight: weight};
		},

		topologicalSort: (graphState = main.graphState) => {
			let G = graphState.state.graph;
			let d = graphState.getGraphData(G);

			let adjacency = G.adjList.slice(); // Make sure adjacency list is a copy, because we're modifying it
			let degrees = graphH.findVertexDegreesDirectional(adjacency);

			let L = [];
			let S = d.nodes.filter((n) => {
				return degrees[n.id].in === 0;
			});

			while(S.length !== 0){
				let nodeN = S.pop();
				L.push(nodeN);

				let nodeNConnectedTo = adjacency[nodeN.id];

				// Remove n to m edges for all nodes m
				d.edges = d.edges.filter((edge) => {
					if(edge.from === nodeN.id && nodeNConnectedTo.includes(edge.to)){
						degrees[edge.to].in--;
						adjacency[nodeN.id] = adjacency[nodeN.id].filter((v) => {
							return v !== edge.to;
						});
						return false;
					}
					return true;
				});

				// If m has no more incoming edges, add it to S
				nodeNConnectedTo.forEach((mID) => {
					if(degrees[mID].in === 0){
						S.push(d.nodes[mID]);
					}
				});
			}

			return d.edges.length > 0 || L;
		},

		isGraphCyclic: (graphState = main.graphState) => {
			return self.topologicalSort(graphState) === true ? true : false;
		},

		directionalEulerian: (directionalDegrees, graphState = main.graphState) => {
			let scc = graphState.getProperty("stronglyConnectedComponents", true);

			let eulerian = true;
			let component = -1;
			directionalDegrees.forEach((deg, id) => {
				if(deg.in !== deg.out){
					eulerian = false;
				}
				if(deg.in > 0){
					if(component === -1){
						component = scc[id];
					}
					if(component !== scc[id]){
						eulerian = false;
					}
				}
			});

			return eulerian;
		},

		hasEulerianCircuit: (degrees) => {
			return degrees.filter((v) => {
				return v % 2 !== 0;
			}).length === 0;
		},

	};

	return self;
});
