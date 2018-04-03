"use strict";

import genericH from './genericHelpers';
import graphH from './graphHelpers';
import SpanningTree from './SpanningTree';
import EdgeImmut from "./GraphImmut/EdgeImmut";
import NodeImmut from "./GraphImmut/NodeImmut";
import GraphImmut from "./GraphImmut/GraphImmut";
import GraphState from "./graphState";

export default class GraphAlgorithms {
    // Welsh-Powell Algorithm
    public colorNetwork = (G: GraphImmut = GraphState.graph): { colors: {}; chromaticNumber: number } => {
        // Get node ID's only
        const nodeArr: number[] = genericH.datasetToArray(G.getAllNodes(), "id") as number[];

        // Put vertices in array in decreasing order of degree
        const degrees = G.getAllOutDegrees();
        const vertexOrder = genericH.sort(nodeArr, (a, b) => {
            return degrees[a] < degrees[b] ? 1 : degrees[a] === degrees[b] ? 0 : -1;
        });

        const colorIndex = {};
        let currentColor = 0;
        while (vertexOrder.length > 0) {
            const root = vertexOrder.shift();
            colorIndex[root] = currentColor;

            const myGroup = [];
            myGroup.push(root);

            for (let i = 0; i < vertexOrder.length;) {
                const p = vertexOrder[i];
                let conflict = false;

                for (let j = 0; j < myGroup.length; j++) {
                    if (G.areAdjacent(p, myGroup[j])) {
                        i++;
                        conflict = true;
                        break;
                    }
                }
                if (conflict) {
                    continue;
                }

                colorIndex[p] = currentColor;
                myGroup.push(p);
                vertexOrder.splice(i, 1);
            }

            currentColor++;
        }

        const chromaticNumber = genericH.max(genericH.flatten(colorIndex) as any[]) + 1;
        return {colors: colorIndex, chromaticNumber};
    };

    public connectedComponents = (G: GraphImmut = GraphState.graph): Promise<{ components: {}; count: number }> => {
        const components = {};
        let componentCount = 0;
        const setComponentNum = (v) => {
            components[v] = componentCount;
        };
        for (let i = 0; i < G.getNumberOfNodes(); i++) {
            if (!(i in components)) {
                const visited = this.depthFirstSearch(G, i);
                visited.forEach(setComponentNum);
                componentCount++;
            }
        }

        return Promise.resolve({components, count: componentCount});
    };

    public depthFirstSearch = (G: GraphImmut = GraphState.graph, start): any[] => {
        const visisted = [];
        const Stack = [];
        Stack.push(start);
        while (Stack.length > 0) {
            const v = Stack.pop();
            if (!visisted.includes(v)) {
                visisted.push(v);
                G.getNodeAdjacency(v).forEach((nodeID) => {
                    Stack.push(nodeID);
                });
            }
        }

        return visisted;
    };

    // Tarjan's algorithm
    public stronglyConnectedComponents = (G: GraphImmut = GraphState.graph): Promise<{ components: {}; count: number }> => {
        let index = 0;
        const indices = {};
        const lowlink = {};
        const S = [];
        const components = {};
        let componentCount = 0;

        const strongConnect = (v) => {
            indices[v] = index;
            lowlink[v] = index++;
            S.push(v);

            G.getNodeAdjacency(v).forEach((w) => {
                if (!(w in indices)) {
                    strongConnect(w);
                    lowlink[v] = Math.min(lowlink[v], lowlink[w]);
                }
                else if (S.includes(w)) {
                    lowlink[v] = Math.min(lowlink[v], indices[w]);
                }
            });

            if (lowlink[v] === indices[v]) {
                let w = -1;
                if (S.length > 0) {
                    do {
                        w = S.pop();
                        components[w] = componentCount;
                    }
                    while (w !== v);
                    componentCount++;
                }
            }
        };

        for (let i = 0; i < G.getNumberOfNodes(); i++) {
            if (!(i in indices)) {
                strongConnect(i);
            }
        }

        return Promise.resolve({components, count: componentCount});
    };

    public breadthFirstSearch = (startNodeID, targetNodeID, G: GraphImmut = GraphState.graph): { pathExists: boolean; path: any[]; distance: number; weight: number } => {
        // Perform the BFS
        const visisted = [];
        const Q = []; // Use Push and Shift for Queue operations
        const edgeTo = {};

        Q.push(startNodeID);
        while (Q.length > 0) {
            const x = Q.shift();
            if (!visisted.includes(x)) {
                visisted.push(x);
                G.getNodeAdjacency(x).forEach((y) => {
                    if (!visisted.includes(y)) {
                        edgeTo[y] = x;
                        Q.push(y);
                    }
                });
            }
        }

        if (visisted.includes(targetNodeID)) {
            // Build the path
            const path = [];
            for (let x = targetNodeID; x !== startNodeID; x = edgeTo[x]) {
                path.push(x);
            }
            path.push(startNodeID);
            path.reverse();

            // Get the path weight
            let weight = 0;
            for (let i = 0; i < path.length - 1; i++) {
                weight += G.getMinWeightEdgeBetween(path[i], path[i + 1]);
            }

            return {pathExists: true, path, distance: path.length, weight};
        }

        return {pathExists: false, path: [], distance: -1, weight: -1};
    };

    public dijkstraSearch = (startNodeID, targetNodeID, G: GraphImmut = GraphState.graph): any => {
        if (!G.isDirected()) {
            G = G.asDirected(true);
        }
        if (!G.isWeighted()) {
            G = G.asWeighted();
        }

        const nonNegative = (G.getAllEdges(true) as EdgeImmut[]).find((edge) => {
            return edge.getWeight() < 0;
        });
        if (typeof nonNegative !== "undefined") {
            genericH.showSimpleModal("Dijkstra Error", "<p>The Dijkstra algorithm only works on graphs" +
                " with totally non-negative edge weights. Please fix the graph so that there are no" +
                " negative edge weights.</p><p>Alternatively, try the Bellman-Ford algorithm which solves" +
                " exactly this problem.</p>");
            return false;
        }

        // Priority Queue implementation for Dijkstra
        const PriorityQueue = function () {
            this._nodes = [];

            this.enqueue = function (priority, key) {
                this._nodes.push({key, priority});
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

        const queue = new PriorityQueue();
        const distances = {};
        const previous = {};
        let path = [];

        // Initialize Queue and distances
        (G.getAllNodes(true) as NodeImmut[]).forEach((node) => {
            let dist = Infinity;
            if (node.getID() === startNodeID) {
                dist = 0;
            }

            distances[node.getID()] = dist;
            queue.enqueue(dist, node.getID());
            previous[node.getID()] = null;
        });

        while (!queue.isEmpty()) {
            let smallest = queue.dequeue();

            if (smallest === targetNodeID) {
                path = [];
                while (previous[smallest] !== null) {
                    path.push(smallest);
                    smallest = previous[smallest];
                }
                break;
            }

            if (distances[smallest] === Infinity) {
                continue;
            }

            G.getNodeAdjacency(smallest).forEach((neighbor) => {
                const alt = distances[smallest] + G.getMinWeightEdgeBetween(smallest, neighbor);

                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = smallest;

                    queue.enqueue(alt, neighbor);
                }
            });
        }

        path.push(startNodeID);
        path.reverse();

        if (distances[targetNodeID] !== Infinity) {
            return {pathExists: true, path, distance: path.length, cost: distances[targetNodeID]};
        }


        return {pathExists: false, path: [], distance: -1, cost: 0};
    };

    public bellmanFord = (startNodeID, targetNodeID, G: GraphImmut = GraphState.graph): any => {
        const distances = [];
        const parents = [];

        // Initialize
        (G.getAllNodes(true) as NodeImmut[]).forEach((node) => {
            distances[node.getID()] = Infinity;
            parents[node.getID()] = null;
        });

        // Relax Edges
        distances[startNodeID] = 0;
        for (let i = 0; i < G.getNumberOfNodes() - 1; i++) {
            (G.getAllEdges(true) as EdgeImmut[]).forEach((edge) => {
                if (distances[edge.getFrom()] + edge.getWeight() < distances[edge.getTo()]) {
                    distances[edge.getTo()] = distances[edge.getFrom()] + edge.getWeight();
                    parents[edge.getTo()] = edge.getFrom();
                }
            });
        }

        // Check for negative weight cycles
        let negativeCylce = false;
        (G.getAllEdges(true) as EdgeImmut[]).forEach((edge) => {
            if (distances[edge.getFrom()] + edge.getWeight() < distances[edge.getTo()]) {
                negativeCylce = true;
            }
        });

        if (distances[targetNodeID] !== Infinity) {
            const path = [targetNodeID];
            while (!path.includes(startNodeID)) {
                path.push(parents[path.slice().pop()]);
            }
            path.reverse();

            return {pathExists: true, path, distance: path.length, cost: distances[targetNodeID]};
        }

        if (negativeCylce) {
            genericH.showSimpleModal("Bellman-Ford Error", "<p>The Bellman-Ford algorithm only works on graphs" +
                " with no negative edge-weight cycles. Please remove the negative cycle and try again.</p>");
            return false;
        }

        return {pathExists: false, path: [], distance: -1, cost: 0};
    };

    public fordFulkerson = (startNodeID, targetNodeID, G: GraphImmut = GraphState.graph): any => {
        // Must be a directed graph
        if (!G.isDirected()) {
            return false;
        }

        // Source == sink
        if (startNodeID === targetNodeID) {
            return false;
        }

        const bfs = this.breadthFirstSearch(startNodeID, targetNodeID, G);
        // No path from source to sink
        if (!bfs.pathExists) {
            return false;
        }

        // If we have a multigraph, then reduce the graph to have single edges with the sum of the capacities
        G = G.reduceMultiGraph((a, b) => {
            return a + b;
        });

        const V = G.getNumberOfNodes();
        let value = 0;
        let marked = null;
        let edgeTo = null;

        const edgeProperties = {};
        (G.getAllEdges(true) as EdgeImmut[]).forEach((edge) => {
            edgeProperties[`${edge.getFrom()}_${edge.getTo()}`] = {
                from: edge.getFrom(),
                to: edge.getTo(),
                capacity: edge.getWeight(),
                flow: 0
            };
        });

        const other = (e, x) => {
            e = e.split("_");
            const a = parseInt(e[0]);
            const b = parseInt(e[1]);
            return x === a ? b : a;
        };

        const residualCapacity = (e, x) => {
            const edge = e.split("_");
            const a = parseInt(edge[0]);
            if (x === a) {
                return edgeProperties[e].flow;
            }
            return edgeProperties[e].capacity - edgeProperties[e].flow;
        };

        const addResidualFlow = (e, x, deltaFlow) => {
            const edge = e.split("_");
            const v = parseInt(edge[0]);
            if (x === v) {
                edgeProperties[e].flow -= deltaFlow;
            }
            else {
                edgeProperties[e].flow += deltaFlow;
            }
        };

        const hasAugmentedPath = () => {
            marked = [];
            edgeTo = [];
            for (let v = 0; v < V; ++v) {
                marked.push(false);
                edgeTo.push(null);
            }

            const queue = [];
            queue.push(startNodeID);

            marked[startNodeID] = true;
            while (queue.length > 0) {
                const v = queue.shift();
                const vertexAdjacency = G.getNodeAdjacency(v);
                for(const i of vertexAdjacency){
                    const e = `${v}_${i}`;
                    const w = other(e, v);
                    if (!marked[w] && residualCapacity(e, w) > 0) {
                        edgeTo[w] = e;
                        marked[w] = true;
                        if (w === targetNodeID) {
                            return true;
                        }

                        queue.push(w);
                    }
                }
            }

            return false;
        };

        while (hasAugmentedPath()) {
            let bottleneckValue = Infinity;
            for (let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x], x)) {
                bottleneckValue = Math.min(bottleneckValue, residualCapacity(edgeTo[x], x));
            }
            for (let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x], x)) {
                addResidualFlow(edgeTo[x], x, bottleneckValue);
            }
            value += bottleneckValue;
        }

        const getFlows = () => {
            const f = [];
            for (let v = 0; v < V; v++) {
                const vertexAdjacency = G.getNodeAdjacency(v);
                for(const i of vertexAdjacency){
                    const e = `${v}_${i}`;
                    if (edgeProperties[e].flow > 0) {
                        f.push(edgeProperties[e]);
                    }
                }
            }

            return f;
        };

        return {maxFlow: value, flowPath: getFlows()};
    };

    public kruskal = (G: GraphImmut = GraphState.graph): { mst: any[]; totalWeight: any } => {
        // If we have a multigraph, reduce it by using the minimum edge weights
        G.reduceMultiGraph(Math.min, Infinity);

        const Q = G.getAllEdges(true) as EdgeImmut[];

        // Sort edges by weight so that they are added to the tree in the order of lowest possible weight
        Q.sort((a, b) => {
            return a.getWeight() - b.getWeight();
        });

        const kruskal = [];
        const set = new SpanningTree(G.getNumberOfNodes());
        while (Q.length > 0 && kruskal.length < G.getNumberOfNodes() - 1) {
            const e = Q.shift();
            if (!set.connected(e.getFrom(), e.getTo())) {
                set.union(e.getFrom(), e.getTo());
                kruskal.push(e);
            }
        }

        // Get the total cost of the MST
        const weight = kruskal.reduce((acc, e) => {
            return acc + e.getWeight();
        }, 0);

        return {mst: kruskal, totalWeight: weight};
    };

    public topologicalSort = (G: GraphImmut = GraphState.graph): boolean | any[] => {
        const adjacency = G.getFullAdjacency();
        const degrees = graphH.findVertexDegreesDirectional(adjacency);

        const L = [];
        const S = (G.getAllNodes(true) as NodeImmut[]).filter((n) => {
            return degrees[n.getID()].in === 0;
        });
        let edges = G.getAllEdges(true) as EdgeImmut[];

        while (S.length !== 0) {
            const nodeN = S.pop();
            L.push(nodeN);

            const nodeNConnectedTo = adjacency[nodeN.getID()];

            // Remove n to m edges for all nodes m
            edges = edges.filter((edge) => {
                if (edge.getFrom() === nodeN.getID() && nodeNConnectedTo.includes(edge.getTo())) {
                    degrees[edge.getTo()].in--;
                    adjacency[nodeN.getID()] = adjacency[nodeN.getID()].filter((v) => {
                        return v !== edge.getTo();
                    });
                    return false;
                }
                return true;
            });

            // If m has no more incoming edges, add it to S
            nodeNConnectedTo.forEach((mID) => {
                if (degrees[mID].in === 0) {
                    S.push(G.getNode(mID, true) as NodeImmut);
                }
            });
        }

        return edges.length > 0 || L;
    };

    public isGraphCyclic = (G: GraphImmut = GraphState.graph): boolean => {
        // If the topological sorting returns true, then it failed, so the graph has a cycle
        return this.topologicalSort(G) === true;
    };

    public directionalEulerian = async (directionalDegrees): Promise<boolean> => {
        const scc = await GraphState.getProperty("stronglyConnectedComponents", true);

        let eulerian = true;
        let component = -1;
        directionalDegrees.forEach((deg, id) => {
            if (deg.in !== deg.out) {
                eulerian = false;
            }
            if (deg.in > 0) {
                if (component === -1) {
                    component = scc[id];
                }
                if (component !== scc[id]) {
                    eulerian = false;
                }
            }
        });

        return eulerian;
    };

    public hasEulerianCircuit = async (degrees): Promise<boolean> => {
        const oddDegree = degrees.filter((v) => {
            return v % 2 !== 0;
        });

        // If any nodes have odd degree, we can short-circuit the algorithm because it cannot be Eulerian
        if (oddDegree.length !== 0) {
            return false;
        }

        const cc = await GraphState.getProperty("connectedComponents", true);

        let eulerian = true;
        let component = -1;
        degrees.forEach((v, i) => {
            if (v !== 0) {
                if (component === -1) {
                    component = cc[i];
                }
                if (component !== cc[i]) {
                    eulerian = false;
                }
            }
        });

        return eulerian;
    };
}

