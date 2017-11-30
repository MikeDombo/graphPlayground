define({
		isAdjacent: (a, b, adjacencyMatrix) => {
			return adjacencyMatrix[a].indexOf(b) !== -1;
		},

		findVertexDegrees: (adjacencyMatrix) => {
			return adjacencyMatrix.map((v) => {
				return v.length;
			});
		},

		findVertexDegreesDirectional: (adjacencyMatrix) => {
			// Adjacency stores IDs of edges TO
			let degrees = [];
			adjacencyMatrix.forEach((v, i) => {
				if(i in degrees){
					degrees[i].out += v.length;
				}
				else{
					degrees[i] = {out: v.length, in: 0};
				}
				v.forEach((outV) => {
					if(outV in degrees){
						degrees[outV].in += 1;
					}
					else{
						degrees[outV] = {in: 1, out: 0};
					}
				});
			});

			return degrees;
		},

		interpolateNodesFromEdges: (edges) => {
			let nodes = new vis.DataSet();
			edges.forEach((v) => {
				if(nodes.get(v.from) === null){
					nodes.add({id: v.from, label: "" + v.from});
				}
				if(nodes.get(v.to) === null){
					nodes.add({id: v.to, label: "" + v.to});
				}
			});

			return nodes;
		},
	}
);
