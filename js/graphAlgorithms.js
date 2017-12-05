define("GraphAlgorithms", ["genericHelpers", "graphHelpers"], (genericH, graphH) => {
	let SpanningTree = function (V) {
		this.id = [];
		for(let v = 0; v < V; v++){
			this.id.push(v);
		}
	};

	SpanningTree.prototype = {
		constructor: SpanningTree,
		union: function (v, w) {
			let q = this.root(v);
			let p = this.root(w);

			if(p !== q){
				this.id[p] = q;
			}
		},

		root: function (q) {
			while(this.id[q] !== q){
				q = this.id[q];
			}
			return q;
		},

		connected: function (v, w) {
			return this.root(v) === this.root(w);
		}
	};


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
			let G = graphState.graph.clone();

			let nodeArr = genericH.datasetToArray(G.getAllNodes(), "id");
			// Put vertices in array in decreasing order of degree
			let degrees = G.getAllOutDegrees();
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
						if(G.areAdjacent(p, myGroup[j])){
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
			let G = graphState.graph.clone();

			let components = {};
			let componentCount = 0;
			for(let i = 0; i < G.getNumberOfNodes(); i++){
				if(!(i in components)){
					let visited = self.depthFirstSearch(G, i);
					visited.forEach((v) => {
						components[v] = componentCount;
					});
					componentCount++;
				}
			}

			return {components: components, count: componentCount};
		},

		depthFirstSearch: (G = graphState.graph.clone(), start) => {
			let visisted = [];
			let Stack = [];
			Stack.push(start);
			while(Stack.length > 0){
				let v = Stack.pop();
				if(!visisted.includes(v)){
					visisted.push(v);
					G.getNodeAdjacency(v).forEach((nodeID) => {
						Stack.push(nodeID);
					});
				}
			}

			return visisted;
		},

		// Tarjan's algorithm
		stronglyConnectedComponents: (graphState = main.graphState) => {
			let G = graphState.graph.clone();

			let index = 0;
			let indices = {};
			let lowlink = {};
			let S = [];
			let components = {};
			let componentCount = 0;

			let strongConnect = (v) => {
				indices[v] = index;
				lowlink[v] = index++;
				S.push(v);

				G.getNodeAdjacency(v).forEach((w) => {
					if(!(w in indices)){
						strongConnect(w);
						lowlink[v] = Math.min(lowlink[v], lowlink[w]);
					}
					else if(S.includes(w)){
						lowlink[v] = Math.min(lowlink[v], indices[w]);
					}
				});

				if(lowlink[v] === indices[v]){
					let w = -1;
					let addedAny = false;
					if(S.length > 0){
						do{
							w = S.pop();
							components[w] = componentCount;
							addedAny = true;
						}
						while(w !== v);
						if(addedAny){
							componentCount++;
						}
					}
				}
			};

			for(let i = 0; i < G.getNumberOfNodes(); i++){
				if(!(i in indices)){
					strongConnect(i);
				}
			}

			return {components: components, count: componentCount};
		},

		breadthFirstSearch: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.graph.clone();

			// Perform the BFS
			let visisted = [];
			let Q = []; // Use Push and Shift for Queue operations
			let edgeTo = {};

			Q.push(startNodeID);
			while(Q.length > 0){
				let x = Q.shift();
				if(!visisted.includes(x)){
					visisted.push(x);
					G.getNodeAdjacency(x).forEach((y) => {
						if(!visisted.includes(y)){
							edgeTo[y] = x;
							Q.push(y);
						}
					});
				}
			}

			let pathExists = visisted.includes(targetNodeID);
			if(pathExists){
				// Build the path
				let path = [];
				for(let x = targetNodeID; x !== startNodeID; x = edgeTo[x]){
					path.push(x);
				}
				path.push(startNodeID);
				path = path.reverse();

				// Get the path weight
				let weight = 0;
				for(let i = 0; i < path.length - 1; i++){
					weight += G.getMinWeightEdgeBetween(path[i], path[i + 1]);
				}

				return {pathExists: pathExists, path: path, distance: path.length, weight: weight};
			}

			return {pathExists: pathExists, path: [], distance: -1, weight: -1};
		},

		dijkstraSearch: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.graph.clone();

			if(!G.isDirected()){
				G.convertToDirected(true);
			}
			else if(!G.isWeighted()){
				G.convertToWeighted();
			}

			let nonNegative = G.getAllEdges().find((edge) => {
				return edge.weight < 0;
			});
			if(typeof nonNegative !== "undefined"){
				genericH.showErrorModal("Dijkstra Error", "<p>The Dijkstra algorithm only works on graphs" +
					" with totally non-negative edge weights. Please fix the graph so that there are no" +
					" negative edge weights.</p><p>Alternatively, try the Bellman-Ford algorithm which solves" +
					" exactly this problem.</p>");
				return false;
			}


			// Priority Queue implementation for Dijkstra
			let PriorityQueue = function () {
				this._nodes = [];

				this.enqueue = function (priority, key) {
					this._nodes.push({key: key, priority: priority});
					this.sort();
				};
				this.dequeue = function () {
					return this._nodes.shift().key;
				};
				this.sort = function () {
					this._nodes.sort(function (a, b) {
						return a.priority - b.priority;
					});
				};
				this.isEmpty = function () {
					return !this._nodes.length;
				};
			};

			let queue = new PriorityQueue();
			let distances = {};
			let previous = {};
			let path = [];

			// Initialize Queue and distances
			G.getAllNodes().forEach((node) => {
				if(node.id === startNodeID){
					distances[node.id] = 0;
					queue.enqueue(0, node.id);
				}
				else{
					distances[node.id] = Infinity;
					queue.enqueue(Infinity, node.id);
				}
				previous[node.id] = null;
			});

			while(!queue.isEmpty()){
				let smallest = queue.dequeue();

				if(smallest === targetNodeID){
					path = [];
					while(previous[smallest]){
						path.push(smallest);
						smallest = previous[smallest];
					}
					break;
				}

				if(!smallest || distances[smallest] === Infinity){
					continue;
				}

				G.getNodeAdjacency(smallest).forEach((neighbor) => {
					let alt = distances[smallest] + G.getMinWeightEdgeBetween(smallest, neighbor);

					if(alt < distances[neighbor]){
						distances[neighbor] = alt;
						previous[neighbor] = smallest;

						queue.enqueue(alt, neighbor);
					}
				});
			}

			path.push(startNodeID);
			path = path.reverse();

			if(distances[targetNodeID] !== Infinity){
				return {pathExists: true, path: path, distance: path.length, cost: distances[targetNodeID]};
			}


			return {pathExists: false, path: [], distance: -1, cost: 0};
		},

		bellmanFord: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.graph.clone();

			let distances = [];
			let parents = [];

			// Initialize
			G.getAllNodes().forEach((node) => {
				distances[node.id] = Infinity;
				parents[node.id] = null;
			});

			// Relax Edges
			distances[startNodeID] = 0;
			for(let i = 0; i < G.getNumberOfNodes() - 1; i++){
				G.getAllEdges().forEach((edge) => {
					if(distances[edge.from] + edge.weight < distances[edge.to]){
						distances[edge.to] = distances[edge.from] + edge.weight;
						parents[edge.to] = edge.from;
					}
				});
			}

			// Check for negative weight cycles
			let negativeCylce = false;
			G.getAllEdges().forEach((edge) => {
				if(distances[edge.from] + edge.weight < distances[edge.to]){
					negativeCylce = true;
				}
			});

			if(distances[targetNodeID] !== Infinity){
				let path = [targetNodeID];
				while(!path.includes(startNodeID)){
					path.push(parents[path.slice().pop()]);
				}
				path = path.reverse();

				return {pathExists: true, path: path, distance: path.length, cost: distances[targetNodeID]};
			}

			if(negativeCylce){
				genericH.showErrorModal("Bellman-Ford Error", "<p>The Bellman-Ford algorithm only works on graphs" +
					" with no negative edge-weight cycles. Please remove the negative cycle and try again.</p>");
				return false;
			}

			return {pathExists: false, path: [], distance: -1, cost: 0};
		},

		fordFulkerson: (startNodeID, targetNodeID, graphState = main.graphState) => {
			let G = graphState.graph.clone();

			// Must be a directed graph
			if(!G.isDirected()){
				return false;
			}

			// Source == sink
			if(startNodeID === targetNodeID){
				return false;
			}

			let bfs = self.breadthFirstSearch(startNodeID, targetNodeID, graphState);
			// No path from source to sink
			if(!bfs.pathExists){
				return false;
			}

			// If we have a multigraph, then reduce the graph to have single edges with the sum of the capacities
			G.reduceMultiGraph((a, b) => {
				return a + b;
			});

			let V = G.getNumberOfNodes();
			let value = 0;
			let marked = null;
			let edgeTo = null;

			let edgeProperties = {};
			G.getAllEdges().forEach((edge) => {
				edgeProperties[edge.from + "_" + edge.to] = {
					from: edge.from,
					to: edge.to,
					capacity: edge.weight,
					flow: 0
				};
			});

			let other = (e, x) => {
				e = e.split("_");
				let a = parseInt(e[0]);
				let b = parseInt(e[1]);
				return x === a ? b : a;
			};

			let residualCapacity = (e, x) => {
				let edge = e.split("_");
				let a = parseInt(edge[0]);
				if(x === a){
					return edgeProperties[e].flow;
				}
				return edgeProperties[e].capacity - edgeProperties[e].flow;
			};

			let addResidualFlow = (e, x, deltaFlow) => {
				let edge = e.split("_");
				let v = parseInt(edge[0]);
				if(x === v){
					edgeProperties[e].flow -= deltaFlow;
				}
				else{
					edgeProperties[e].flow += deltaFlow;
				}
			};

			let hasAugmentedPath = () => {
				marked = [];
				edgeTo = [];
				for(let v = 0; v < V; ++v){
					marked.push(false);
					edgeTo.push(null);
				}

				let queue = [];
				queue.push(startNodeID);

				marked[startNodeID] = true;
				while(queue.length > 0){
					let v = queue.shift();
					let adj_v = G.getNodeAdjacency(v);
					for(let i = 0; i < adj_v.length; i++){
						let e = v + "_" + adj_v[i];
						let w = other(e, v);
						if(!marked[w] && residualCapacity(e, w) > 0){
							edgeTo[w] = e;
							marked[w] = true;
							if(w === targetNodeID){
								return true;
							}

							queue.push(w);
						}
					}
				}

				return false;
			};

			while(hasAugmentedPath()){
				let bottleneckValue = Infinity;
				for(let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x], x)){
					bottleneckValue = Math.min(bottleneckValue, residualCapacity(edgeTo[x], x));
				}
				for(let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x], x)){
					addResidualFlow(edgeTo[x], x, bottleneckValue);
				}
				value += bottleneckValue;
			}

			let getFlows = () => {
				let f = [];
				for(let v = 0; v < V; v++){
					let adj_v = G.getNodeAdjacency(v);
					for(let i = 0; i < adj_v.length; i++){
						let e = v + "_" + adj_v[i];
						if(edgeProperties[e].flow > 0){
							f.push(edgeProperties[e]);
						}
					}
				}

				return f;
			};

			return {maxFlow: value, flowPath: getFlows()};
		},

		kruskal: (graphState = main.graphState) => {
			let G = graphState.graph.clone();

			// If we have a multigraph, reduce it by using the minimum edge weights
			G.reduceMultiGraph(Math.min, Infinity);

			let Q = [];
			G.getAllEdges().forEach((edge) => {
				Q.push({from: edge.from, to: edge.to, weight: edge.weight});
			});

			// Sort edges by weight so that they are added to the tree in the order of lowest possible weight
			Q.sort((a, b) => {
				return a.weight - b.weight;
			});

			let kruskal = [];
			let set = new SpanningTree(G.getNumberOfNodes());
			while(Q.length > 0 && kruskal.length < G.getNumberOfNodes() - 1){
				let e = Q.shift();
				if(!set.connected(e.from, e.to)){
					set.union(e.from, e.to);
					kruskal.push(e);
				}
			}

			// Get the total cost of the MST
			let weight = kruskal.reduce((acc, e) => {
				return acc + e.weight;
			}, 0);

			return {mst: kruskal, totalWeight: weight};
		},

		topologicalSort: (graphState = main.graphState) => {
			let G = graphState.graph.clone();

			let adjacency = G.getFullAdjacency(); // Make sure adjacency list is a copy, because we're modifying it
			let degrees = graphH.findVertexDegreesDirectional(adjacency);

			let L = [];
			let S = G.getAllNodes().filter((n) => {
				return degrees[n.id].in === 0;
			});
			let edges = G.getAllEdges();

			while(S.length !== 0){
				let nodeN = S.pop();
				L.push(nodeN);

				let nodeNConnectedTo = adjacency[nodeN.id];

				// Remove n to m edges for all nodes m
				edges = edges.filter((edge) => {
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
						S.push(G.getNode(mID));
					}
				});
			}

			return edges.length > 0 || L;
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

		hasEulerianCircuit: (degrees, graphState = main.graphState) => {
			let oddDegree = degrees.filter((v) => {
				return v % 2 !== 0;
			});

			// If any nodes have odd degree, it cannot be Eulerian
			if(oddDegree.length !== 0){
				return false;
			}

			let cc = graphState.getProperty("connectedComponents", true);

			let eulerian = true;
			let component = -1;
			degrees.forEach((v, i) => {
				if(v !== 0){
					if(component === -1){
						component = cc[i];
					}
					if(component !== cc[i]){
						eulerian = false;
					}
				}
			});

			return eulerian;
		},

	};

	return self;
});
