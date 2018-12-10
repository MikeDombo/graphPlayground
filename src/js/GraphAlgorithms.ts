"use strict";

import genericH from "./util/genericHelpers";
import graphH from "./util/graphHelpers";
import SpanningTree from "./classes/SpanningTree";
import EdgeImmut, { EdgeImmutPlain } from "./classes/GraphImmut/EdgeImmut";
import NodeImmut from "./classes/GraphImmut/NodeImmut";
import GraphImmut from "./classes/GraphImmut/GraphImmut";
import GraphState from "./graphState";
import { GraphPlain } from "./util/predefinedGraphs";

type EdgeFlowProp = { from: number; to: number; capacity: number; flow: number };
export type MSTResult = { mst: EdgeImmutPlain[]; totalWeight: number };
export type FlowResult = { maxFlow: number; flowPath: EdgeFlowProp[] };
export type ShortestPathResult = {
    pathExists: boolean;
    path: number[];
    distance: number;
    cost?: number;
    weight?: number;
};
export type ConnectedComponentResult = { components: { [key: number]: number }; count: number };

export default class GraphAlgorithms {
    public static graphPlainToGraphImmut = (gp: GraphPlain): GraphImmut => {
        return new GraphImmut(gp.nodes, gp.edges, gp.directed, gp.weighted);
    };

    // Welsh-Powell Algorithm
    public static colorNetwork = (G: GraphImmut = GraphState.graph): { colors: {}; chromaticNumber: number } => {
        // Get node ID's only
        const nodeArr: number[] = genericH.datasetToArray(G.getAllNodes(), "id") as number[];

        // Put vertices in array in decreasing order of degree
        const degrees = G.getAllOutDegrees();
        const vertexOrder = genericH.sort(nodeArr, (a, b) => {
            return degrees[a] < degrees[b] ? 1 : degrees[a] === degrees[b] ? 0 : -1;
        });

        const colorIndex: { [key: number]: number } = {};
        let currentColor = 0;
        while (vertexOrder.length > 0) {
            const root = vertexOrder.shift()!;
            colorIndex[root] = currentColor;

            const myGroup = [];
            myGroup.push(root);

            for (let i = 0; i < vertexOrder.length; ) {
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
        return { colors: colorIndex, chromaticNumber };
    };

    public static connectedComponents = (G: GraphImmut = GraphState.graph): ConnectedComponentResult => {
        const components: { [key: number]: number } = {};
        let componentCount = 0;
        const setComponentNum = (v: number) => {
            components[v] = componentCount;
        };
        for (let i = 0; i < G.getNumberOfNodes(); i++) {
            if (!(i in components)) {
                const visited = GraphAlgorithms.depthFirstSearch(i, G);
                visited.forEach(setComponentNum);
                componentCount++;
            }
        }

        return { components, count: componentCount };
    };

    public static depthFirstSearch = (start: number, G = GraphState.graph): number[] => {
        const visisted: number[] = [];
        const Stack: number[] = [];
        Stack.push(start);
        while (Stack.length > 0) {
            const v = Stack.pop()!;
            if (!visisted.includes(v)) {
                visisted.push(v);
                G.getNodeAdjacency(v).forEach(nodeID => {
                    Stack.push(nodeID);
                });
            }
        }

        return visisted;
    };

    // Tarjan's algorithm
    public static stronglyConnectedComponents = (G: GraphImmut = GraphState.graph): ConnectedComponentResult => {
        let index = 0;
        const indices: { [key: number]: number } = {};
        const lowlink: { [key: number]: number } = {};
        const S: number[] = [];
        const components: { [key: number]: number } = {};
        let componentCount = 0;

        const strongConnect = (v: number) => {
            indices[v] = index;
            lowlink[v] = index++;
            S.push(v);

            G.getNodeAdjacency(v).forEach(w => {
                if (!(w in indices)) {
                    strongConnect(w);
                    lowlink[v] = Math.min(lowlink[v], lowlink[w]);
                } else if (S.includes(w)) {
                    lowlink[v] = Math.min(lowlink[v], indices[w]);
                }
            });

            if (lowlink[v] === indices[v]) {
                let w = -1;
                if (S.length > 0) {
                    do {
                        w = S.pop()!;
                        components[w] = componentCount;
                    } while (w !== v);
                    componentCount++;
                }
            }
        };

        for (let i = 0; i < G.getNumberOfNodes(); i++) {
            if (!(i in indices)) {
                strongConnect(i);
            }
        }

        return { components, count: componentCount };
    };

    public static breadthFirstSearch = (
        startNodeID: number,
        targetNodeID: number,
        G: GraphImmut = GraphState.graph
    ): ShortestPathResult => {
        // Perform the BFS
        const visisted: number[] = [];
        const Q: number[] = []; // Use Push and Shift for Queue operations
        const edgeTo: { [key: number]: number } = {};

        Q.push(startNodeID);
        while (Q.length > 0) {
            const x = Q.shift()!;
            if (!visisted.includes(x)) {
                visisted.push(x);
                G.getNodeAdjacency(x).forEach(y => {
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

            return { pathExists: true, path, distance: path.length, weight };
        }

        return { pathExists: false, path: [], distance: -1, weight: -1 };
    };

    public static dijkstraSearch = (
        startNodeID: number,
        targetNodeID: number,
        G: GraphImmut = GraphState.graph
    ): ShortestPathResult | boolean => {
        if (!G.isDirected()) {
            G = G.asDirected(true);
        }
        if (!G.isWeighted()) {
            G = G.asWeighted();
        }

        const nonNegative = (G.getAllEdges(true) as EdgeImmut[]).find(edge => {
            return edge.getWeight() < 0;
        });
        if (typeof nonNegative !== "undefined") {
            return false;
        }

        // Priority Queue implementation for Dijkstra
        class PriorityQueue {
            private readonly _nodes: { key: number | string; priority: number }[] = [];

            enqueue(priority: number, key: number): void {
                this._nodes.push({ key, priority });
                this.sort();
            }

            dequeue(): number | string {
                return this._nodes.shift()!.key;
            }

            sort(): void {
                this._nodes.sort((a: { priority: number }, b: { priority: number }) => {
                    return a.priority - b.priority;
                });
            }

            isEmpty(): boolean {
                return !this._nodes.length;
            }
        }

        const queue = new PriorityQueue();
        const distances: { [key: number]: number } = {};
        const previous: { [key: number]: number | null } = {};
        let path = [];

        // Initialize Queue and distances
        (G.getAllNodes(true) as NodeImmut[]).forEach(node => {
            let dist = Infinity;
            if (node.getID() === startNodeID) {
                dist = 0;
            }

            distances[node.getID()] = dist;
            queue.enqueue(dist, node.getID());
            previous[node.getID()] = null;
        });

        while (!queue.isEmpty()) {
            let smallest = queue.dequeue() as number;

            if (smallest === targetNodeID) {
                path = [];
                while (previous[smallest] !== null) {
                    path.push(smallest);
                    smallest = previous[smallest]!;
                }
                break;
            }

            if (distances[smallest] === Infinity) {
                continue;
            }

            G.getNodeAdjacency(smallest).forEach(neighbor => {
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
            return { pathExists: true, path, distance: path.length, cost: distances[targetNodeID] };
        }

        return { pathExists: false, path: [], distance: -1, cost: 0 };
    };

    public static bellmanFord = (
        startNodeID: number,
        targetNodeID: number,
        G: GraphImmut = GraphState.graph
    ): ShortestPathResult | boolean => {
        const distances: number[] = [];
        const parents: (number | null)[] = [];

        // Initialize
        (G.getAllNodes(true) as NodeImmut[]).forEach(node => {
            distances[node.getID()] = Infinity;
            parents[node.getID()] = null;
        });

        // Relax Edges
        distances[startNodeID] = 0;
        for (let i = 0; i < G.getNumberOfNodes() - 1; i++) {
            (G.getAllEdges(true) as EdgeImmut[]).forEach(edge => {
                if (distances[edge.getFrom()] + edge.getWeight() < distances[edge.getTo()]) {
                    distances[edge.getTo()] = distances[edge.getFrom()] + edge.getWeight();
                    parents[edge.getTo()] = edge.getFrom();
                }
            });
        }

        // Check for negative weight cycles
        let negativeCylce = false;
        (G.getAllEdges(true) as EdgeImmut[]).forEach(edge => {
            if (distances[edge.getFrom()] + edge.getWeight() < distances[edge.getTo()]) {
                negativeCylce = true;
            }
        });

        if (distances[targetNodeID] !== Infinity) {
            const path: number[] = [targetNodeID];
            while (!path.includes(startNodeID)) {
                path.push(parents[path.slice().pop()!] as number);
            }
            path.reverse();

            return { pathExists: true, path, distance: path.length, cost: distances[targetNodeID] };
        }

        if (negativeCylce) {
            return false;
        }

        return { pathExists: false, path: [], distance: -1, cost: 0 };
    };

    public static fordFulkerson = (
        startNodeID: number,
        targetNodeID: number,
        G: GraphImmut = GraphState.graph
    ): boolean | FlowResult => {
        // Must be a directed graph
        if (!G.isDirected()) {
            return false;
        }

        // Source == sink
        if (startNodeID === targetNodeID) {
            return false;
        }

        const bfs = GraphAlgorithms.breadthFirstSearch(startNodeID, targetNodeID, G);
        // No path from source to sink
        if (!bfs.pathExists) {
            return false;
        }

        // If we have a multigraph, then reduce the graph to have single edges with the sum of the capacities
        G = G.reduceMultiGraph((a, b) => {
            return a + b;
        }, 0);

        const V = G.getNumberOfNodes();
        let value = 0;
        let marked: boolean[] = [];
        let edgeTo: (string | null)[] = [];

        const edgeProperties: { [key: string]: EdgeFlowProp } = {};
        (G.getAllEdges(true) as EdgeImmut[]).forEach(edge => {
            edgeProperties[`${edge.getFrom()}_${edge.getTo()}`] = {
                from: edge.getFrom(),
                to: edge.getTo(),
                capacity: edge.getWeight(),
                flow: 0
            };
        });

        const other = (e: string, x: number) => {
            const edge = e.split("_");
            const a = parseInt(edge[0]);
            const b = parseInt(edge[1]);
            return x === a ? b : a;
        };

        const residualCapacity = (e: string, x: number) => {
            const edge = e.split("_");
            const a = parseInt(edge[0]);
            if (x === a) {
                return edgeProperties[e].flow;
            }
            return edgeProperties[e].capacity - edgeProperties[e].flow;
        };

        const addResidualFlow = (e: string, x: number, deltaFlow: number) => {
            const edge = e.split("_");
            const v = parseInt(edge[0]);
            if (x === v) {
                edgeProperties[e].flow -= deltaFlow;
            } else {
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
                const v = queue.shift()!;
                const vertexAdjacency = G.getNodeAdjacency(v);
                for (const i of vertexAdjacency) {
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
            for (let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x]!, x)) {
                bottleneckValue = Math.min(bottleneckValue, residualCapacity(edgeTo[x]!, x));
            }
            for (let x = targetNodeID; x !== startNodeID; x = other(edgeTo[x]!, x)) {
                addResidualFlow(edgeTo[x]!, x, bottleneckValue);
            }
            value += bottleneckValue;
        }

        const getFlows = (): EdgeFlowProp[] => {
            const f: EdgeFlowProp[] = [];
            for (let v = 0; v < V; v++) {
                const vertexAdjacency = G.getNodeAdjacency(v);
                for (const i of vertexAdjacency) {
                    const e = `${v}_${i}`;
                    if (edgeProperties[e].flow > 0) {
                        f.push(edgeProperties[e]);
                    }
                }
            }

            return f;
        };

        return { maxFlow: value, flowPath: getFlows() };
    };

    public static kruskal = (G: GraphImmut = GraphState.graph): MSTResult => {
        // If we have a multigraph, reduce it by using the minimum edge weights
        G.reduceMultiGraph();

        const Q: EdgeImmut[] = G.getAllEdges(true) as EdgeImmut[];

        // Sort edges by weight so that they are added to the tree in the order of lowest possible weight
        Q.sort((a, b) => {
            return a.getWeight() - b.getWeight();
        });

        const kruskal: EdgeImmut[] = [];
        const set = new SpanningTree(G.getNumberOfNodes());
        while (Q.length > 0 && kruskal.length < G.getNumberOfNodes() - 1) {
            const e = Q.shift()!;
            if (!set.connected(e.getFrom(), e.getTo())) {
                set.union(e.getFrom(), e.getTo());
                kruskal.push(e);
            }
        }

        // Get the total cost of the MST
        const weight = kruskal.reduce((acc, e) => {
            return acc + e.getWeight();
        }, 0);

        return { mst: (kruskal as any) as EdgeImmutPlain[], totalWeight: weight };
    };

    public static topologicalSort = (G: GraphImmut = GraphState.graph): boolean | NodeImmut[] => {
        const adjacency = G.getFullAdjacency();
        const degrees = graphH.findVertexDegreesDirectional(adjacency);

        const L: NodeImmut[] = [];
        const S: NodeImmut[] = (G.getAllNodes(true) as NodeImmut[]).filter(n => {
            return degrees[n.getID()].in === 0;
        });
        let edges = G.getAllEdges(true) as EdgeImmut[];

        while (S.length !== 0) {
            const nodeN = S.pop()!;
            L.push(nodeN);

            const nodeNConnectedTo = adjacency[nodeN.getID()];

            // Remove n to m edges for all nodes m
            edges = edges.filter(edge => {
                if (edge.getFrom() === nodeN.getID() && nodeNConnectedTo.includes(edge.getTo())) {
                    degrees[edge.getTo()].in--;
                    adjacency[nodeN.getID()] = adjacency[nodeN.getID()].filter(v => {
                        return v !== edge.getTo();
                    });
                    return false;
                }
                return true;
            });

            // If m has no more incoming edges, add it to S
            nodeNConnectedTo.forEach(mID => {
                if (degrees[mID].in === 0) {
                    S.push(G.getNode(mID, true) as NodeImmut);
                }
            });
        }

        return edges.length > 0 || L;
    };

    public static isGraphCyclic = (G: GraphImmut = GraphState.graph): boolean => {
        // If the topological sorting returns true, then it failed, so the graph has a cycle
        return GraphAlgorithms.topologicalSort(G) === true;
    };

    public static directionalEulerian = (directionalDegrees: { in: number; out: number }[], scc: number[]): boolean => {
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

    public static hasEulerianCircuit = (degrees: number[], cc: number[]): boolean => {
        const oddDegree = degrees.filter(v => {
            return v % 2 !== 0;
        });

        // If any nodes have odd degree, we can short-circuit the algorithm because it cannot be Eulerian
        if (oddDegree.length !== 0) {
            return false;
        }

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
