define(["graphHelpers", "genericHelpers"], (graphH, genericH) =>{
	return {
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
			// TODO
			{
				name: "Dijkstra Shortest Path",
				directional: true,
				applyFunc: "main.makeAndPrintDijkstra();",
				display: false
			},
			// TODO
			{name: "Bellman-Ford Shortest Path", weighted: true, applyFunc: "main.makeAndPrintBFSP();", display: false},
			{name: "Eulerian", directional: false, display: false, applyFunc: null},
			{name: "Eulerian", directional: true, display: true, applyFunc: "main.makeAndPrintDirectionalEulerian();"},
		],
		colorNetwork: function (graphState = main.graphState){
			let nodes = graphState.state.nodes;
			let adjacency = graphState.state.adjacency;
			let degrees = graphState.state.degrees;

			let nodeArr = genericH.datasetToArray(nodes, "id");
			// Put vertices in array in decreasing order of degree
			let vertexOrder = nodeArr.sort((a, b) =>{
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

				myGroup = [];
				currentColor++;
			}

			let chromaticNumber = genericH.max(genericH.flatten(colorIndex)) + 1;
			return {colors: colorIndex, chromaticNumber: chromaticNumber};
		},

		connectedComponents: function (graphState = main.graphState){
			let G = graphState.state.graph;
			let cc = new jsgraphs.ConnectedComponents(G);
			let componentIndex = {};
			for(let v = 0; v < G.V; v++){
				componentIndex[v] = cc.componentId(v);
			}
			return {components: componentIndex, count: cc.componentCount()};
		},

		stronglyConnectedComponents: function (graphState = main.graphState){
			let G = graphState.state.graph;
			let cc = new jsgraphs.StronglyConnectedComponents(G);
			let componentIndex = {};
			for(let v = 0; v < G.V; v++){
				componentIndex[v] = cc.componentId(v);
			}
			return {components: componentIndex, count: cc.componentCount()};
		},

		breadthFirstSearch: function (startNodeID, targetNodeID, graphState = main.graphState){
			let G = graphState.state.graph;
			let bfs = new jsgraphs.BreadthFirstSearch(G, startNodeID);

			if(bfs.hasPathTo(targetNodeID)){
				return {pathExists: true, path: bfs.pathTo(targetNodeID), distance: bfs.pathTo(targetNodeID).length};
			}

			return {pathExists: false, path: [], distance: -1};
		},

		directionalEulerian: function (directionalDegrees, graphState = main.graphState){
			let scc = graphState.getProperty("stronglyConnectedComponents", true);

			eulerian = true;
			component = -1;
			directionalDegrees.forEach((deg, id) =>{
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

		hasEulerianCircuit: function (degrees){
			return degrees.filter((v) =>{
				return v % 2 !== 0;
			}).length === 0;
		},

	};
});
