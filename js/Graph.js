define("Graph", [], () => {
		"use strict";

		let Graph = function (V, edges = null, directed = false, weighted = false) {
			this.nodes = [];
			this.edges = [];
			this.numNodes = 0;
			this.directed = directed;
			this.weighted = weighted;

			let nodeNum = V;
			let nodeList = [];
			// If were are given the actual nodes (instead of the number of nodes), add them to a list and count them
			if(typeof V !== "number"){
				nodeNum = 0;
				V.forEach((n) => {
					if(!("id" in n)){
						n.id = nodeNum++;
					}

					nodeList[n.id] = this.addNode(n);
				});
			}
			else {
				// Create the nodes
				for(let i = 0; i < nodeNum; i++){
					nodeList.push(this.addNode({}));
				}
			}

			// If we are given edges, add them to the graph
			if(typeof edges !== "undefined" && edges !== null){
				edges.forEach((edge) => {
					let weight = 0;
					if("weight" in edge && this.weighted){
						weight = edge.weight;
					}
					this.addEdge(nodeList[edge.from], nodeList[edge.to], weight);
				});
			}
		};

		Graph.prototype = {
			constructor: Graph,

			clone: function(){
				let G = new Graph(this.numNodes, null, this.directed, this.weighted);

				this.nodes.forEach((v) => {
					G.editNode(v.id, {label: v.label, color: v.color, x: v.x, y: v.y});
				});

				this.edges.forEach((edge) => {
					G.addEdge(edge.from, edge.to, edge.weight);
				});

				return G;
			},

			addNode: function (data = null) {
				if(data === null){
					data = {};
				}

				data.id = this.numNodes++;
				if(!("label" in data)){
					data.label = data.id.toString();
				}
				data.adjacency = [];

				this.nodes[data.id] = data;

				return data.id;
			},

			editNode: function (id, data) {
				if(!(id in this.nodes)){
					return false;
				}

				Object.keys(data).forEach((k) => {
					// Do not allow overwriting ID or adjacency
					if(k.toLowerCase() !== "id" && k.toLowerCase() !== "adjacency"){
						this.nodes[id][k] = data[k];
					}
				});
			},

			deleteNode: function (id) {
				// Make sure the ID exists
				if(!(id >= 0 && id < this.numNodes)){
					return false;
				}

				let nodeMap = {}; // Map for old IDs to new ones since we're deleting an entry

				// Delete all edges containing id
				this.nodes[id].adjacency.forEach((v) => {
					this.deleteEdge(id, v);
				});

				// If we are directed, then our adjacency list doesn't contain all the edges that we need to delete.
				// So, search all the nodes to see who points to us and delete that edge.
				if(this.directed){
					this.nodes.forEach((node) => {
						node.adjacency.forEach((v) => {
							this.deleteEdge(v, id);
						});
					});
				}

				this.numNodes--; // Decrease the number of nodes

				let origPos = {};
				// Remove it from the node list
				let nodeCount = 0;
				this.nodes = this.nodes.filter((n) => {
					if(n.id === id){
						nodeMap[n.id] = -1;
					}
					else {
						nodeMap[n.id] = nodeCount++;
					}
					origPos[n.id] = {x: n.x, y: n.y};

					return n.id !== id;
				});

				// Remap edges
				this.edges.forEach((edge) => {
					edge.from = nodeMap[edge.from];
					edge.to = nodeMap[edge.to];
				});

				let newPos = {};

				// Remap node id's and labels (when applicable)
				this.nodes.forEach((node) => {
					if("label" in node && node.id.toString() === node.label){
						node.label = nodeMap[node.id].toString();
					}

					// Remap ID's in adjacency
					node.adjacency.forEach((v, i) => {
						node.adjacency[i] = nodeMap[v];
					});

					node.id = nodeMap[node.id];
					newPos[node.id] = {x: node.x, y: node.y};
				});
			},

			addEdge: function (from, to, weight = 1) {
				if(!this.weighted){
					weight = 1; // Ensure that edge weights are 1 if this is an unweighted graph
				}

				this.edges.push({from: from, to: to, weight: weight});

				this.nodes[from].adjacency.push(to);
				if(!this.directed){
					this.nodes[to].adjacency.push(from);
				}
			},

			deleteEdge: function (from, to, weight = null, deleteAll = true) {
				let adjacencyFilter = (id1, id2) => {
					let found = false;
					this.nodes[id1].adjacency = this.nodes[id1].adjacency.filter((n) => {
						if(found && !deleteAll){
							return true;
						}
						if(!found && n === id2){
							found = true;
						}
						return n !== id2;
					});
				};

				let foundOneEdge = false;

				this.edges = this.edges.filter((edge) => {
					// If we're not deleting everything and we have found one edge, then do not filter anymore
					if(foundOneEdge && !deleteAll){
						return true;
					}

					// If we have an exact match
					if(edge.from === from && edge.to === to && (weight === null || edge.weight === weight)){
						foundOneEdge = true;
						adjacencyFilter(from, to);

						// If we are undirected, make sure to remove the back-pointing edge
						if(!this.directed){
							adjacencyFilter(to, from);
						}

						return false; // Remove this edge
					}

					// If we are undirected, check for opposing matches
					if(!this.directed){
						if(edge.from === to && edge.to === from && (weight === null || edge.weight === weight)){
							adjacencyFilter(to, from);
							adjacencyFilter(from, to);
							foundOneEdge = true;

							return false; // Remove this edge
						}
					}

					return true;
				});
			},

			editEdge: function (from, to, newWeight, oldWeight = null) {
				// Editing only makes sense for weighted graphs.
				// To change from/to, just delete the edge and add a new one
				if(!this.weighted){
					return;
				}

				this.edges.forEach((edge) => {
					if(edge.from === from && edge.to === edge.to && (oldWeight === null || edge.weight === oldWeight)){
						edge.weight = newWeight;
					}
				});
			},

			getNode: function (id) {
				return this.nodes[id];
			},

			getNodeAdjacency: function (id) {
				return this.nodes[id].adjacency;
			},

			getFullAdjacency: function() {
				let adj = [];
				this.nodes.forEach((n) => {
					adj[n.id] = n.adjacency;
				});

				return adj;
			},

			getNodeOutDegree: function (id) {
				return this.nodes[id].adjacency.length;
			},

			getAllOutDegrees: function(){
				let degrees = [];
				this.nodes.forEach((node) => {
					degrees[node.id] = node.adjacency.length;
				});

				return degrees;
			},

			getAllNodes: function(){
				return this.nodes;
			},

			getAllEdges: function(){
				return this.edges;
			},

			getNumberOfNodes: function(){
				return this.numNodes;
			},

			getNumberOfEdges: function(){
				return this.edges.length;
			},

			areAdjacent: function (id1, id2) {
				return this.nodes[id1].adjacency.includes(id2);
			},

			getEdgesBetween: function(id1, id2) {
				let edgeList = [];
				this.edges.forEach((edge) => {
					if(!this.directed){
						if(edge.from === id2 && edge.to === id1){
							edgeList.push(edge);
						}
					}

					if(edge.from === id1 && edge.to === id2){
						edgeList.push(edge);
					}
				});

				return edgeList;
			},

			getMinWeightEdgeBetween: function(id1, id2) {
				let minWeight = Infinity;
				this.getEdgesBetween(id1, id2).forEach((edge) => {
					if(edge.weight < minWeight){
						minWeight = edge.weight;
					}
				});

				return minWeight;
			},

			getNodeInDegree: function(id) {
				let degree = 0;
				this.nodes.forEach((node) => {
					node.adjacency.forEach((n) => {
						if(n === id){
							degree++;
						}
					});
				});

				return degree;
			},

			getGraphType: function () {
				return {directed: this.directed, weighted: this.weighted};
			},

			convertToWeighted: function () {
				this.weighted = true;
				this.edges.forEach((edge) => {
					if(!("weight" in edge) || typeof edge.weight === "undefined" || edge.weight === null){
						edge.weight = 1;
					}
				});
			},

			convertToUnWeighted: function () {
				this.weighted = false;
				this.edges.forEach((edge) => {
					if(!("weight" in edge) || typeof edge.weight === "undefined" || edge.weight === null || edge.weight !== 1){
						edge.weight = 1;
					}
				});
			},

			convertToDirected: function (doubleEdges = false) {
				if(!doubleEdges){
					this.directed = true;
					return;
				}

				this.edges.forEach((edge) => {
					this.addEdge(edge.to, edge.from, edge.weight);
				});
			},

			getGraphAsUndirected: function () {
				let newEdges = [];
				let addedEdges = {};

				this.edges.forEach((edge) => {
					let from = edge.from;
					let to = edge.to;
					if(to > from){
						from = to;
						to = edge.from;
					}
					if(!(from + "_" + to in addedEdges)){
						addedEdges[from + "_" + to] = null;
						newEdges.push({from: from, to: to, weight: edge.weight});
					}
				});

				let G = new Graph(this.numNodes, null, false, this.weighted);

				this.nodes.forEach((n) => {
					G.editNode(n.id, {label: n.label, color: n.color, x: n.x, y: n.y});
				});

				newEdges.forEach((edge) => {
					G.addEdge(edge.from, edge.to, edge.weight);
				});

				return G;
			},

			reverseDiGraph: function() {
				// Only reverse directed graphs
				if(!this.directed){
					return false;
				}

				this.edges.forEach((edge) => {
					//                                      Do not delete all edges from->to, only 1
					this.deleteEdge(edge.from, edge.to, edge.weight, false);
					this.addEdge(edge.to, edge.from, edge.weight);
				});
			},

			isWeighted: function(){
				return this.weighted;
			},

			isDirected: function (){
				return this.directed;
			},
		};

		return Graph;
	}
)
;
