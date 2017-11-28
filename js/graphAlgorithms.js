define(["graphHelpers", "genericHelpers"], (graphH, genericH) =>{
	return {
		colorNetwork: function (graphState = main.graphState){
			let d = main.singleyConnectGraph(graphState.state.nodes, graphState.state.edges, network.body.nodes);
			let nodes = d.nodes;
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

		connectedComponents: function(graphState = main.graphState){
			let G = graphState.state.graph;
			let cc = new jsgraphs.ConnectedComponents(G);
			console.log(cc);
			let componentIndex = {};
			for (let v = 0; v < G.V; v++) {
				componentIndex[v] = cc.componentId(v);
			}
			return {components: componentIndex, count: cc.componentCount()};
		},

		hasEulerianCircuit: function (degrees){
			return degrees.filter((v) =>{
				return v % 2 !== 0;
			}).length === 0;
		},

	};
});
