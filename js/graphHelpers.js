define({
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
			let nodes = [];
			edges.forEach((v) => {
				nodes[v.from] = {id: v.from, label: "" + v.from};
				nodes[v.to] = {id: v.to, label: "" + v.to};
			});

			return nodes;
		},
	}
);
