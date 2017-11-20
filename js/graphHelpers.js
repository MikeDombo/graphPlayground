define({
		isAdjacent: function (a, b, adjacencyMatrix){
			return adjacencyMatrix[a].indexOf(b) !== -1;
		},

		findVertexDegrees: function (adjacencyMatrix){
			return adjacencyMatrix.map((v) =>{
				return v.length;
			});
		},

		makeAdjacencyMatrix: function (nodes, edges){
			let adjacency = [];
			let adjacencyRepeated = [];
			nodes.forEach((v) =>{
				adjacency[v.id] = [];
				adjacencyRepeated[v.id] = [];
			}, {order: "id"});

			edges.forEach((v) =>{
				let n1 = v.from;
				let n2 = v.to;
				if(v.from > v.to){
					n1 = v.to;
					n2 = v.from;
				}

				if(adjacency[n1].indexOf(n2) === -1){
					adjacency[n1].push(n2);
				}
				if(adjacency[n2].indexOf(n1) === -1){
					adjacency[n2].push(n1);
				}

				adjacencyRepeated[n1].push(n2);
				adjacencyRepeated[n2].push(n1);
			});
			return {adjacency: adjacency, adjacencyRepeated: adjacencyRepeated};
		},

		makeSingleAdjacencyMatrix: function (nodes, edges){
			let adjacency = [];
			let nodeMap = {};
			let nextID = 0;

			nodes.forEach((v) =>{
				nodeMap[v.id] = nextID;
				adjacency[nextID++] = [];
			}, {order: "id"});

			edges.forEach((v) =>{
				let n1 = nodeMap[v.from];
				let n2 = nodeMap[v.to];
				if(v.from > v.to){
					n1 = nodeMap[v.to];
					n2 = nodeMap[v.from];
				}

				if(adjacency[n1].indexOf(n2) === -1){
					adjacency[n1].push(n2);
				}
			});

			return {matrix: adjacency, map: nodeMap};
		},

		interpolateNodesFromEdges: function(edges){
			let nodes = new vis.DataSet();
			edges.forEach((v) => {
				if(nodes.get(v.from) === null){
					nodes.add({id: v.from, label: ""+v.from});
				}
				if(nodes.get(v.to) === null){
					nodes.add({id: v.to, label: ""+v.to});
				}
			});

			return nodes;
		},
	}
);
