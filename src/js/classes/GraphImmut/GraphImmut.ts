"use strict";

import { List } from 'immutable';
import { default as NodeImmut, NodeImmutPlain } from './NodeImmut';
import { default as EdgeImmut, EdgeImmutPlain } from './EdgeImmut';

interface NodeMapping {
    [key: number]: number
}

const filterExtraAttr = (data: any, labels: any) => {
    return Object.keys(data)
        .filter((key) => !(labels).includes(key))
        .reduce((obj: any, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
};

const filterNodeExtraAttr = (data: any) => {
    return filterExtraAttr(data, ["label", "id"]);
};

const filterEdgeExtraAttr = (data: any) => {
    return filterExtraAttr(data, ["from", "to", "weight"]);
};

const genericEdgesToImmutEdges = (edges: any, nodeMap: NodeMapping = {}): boolean | List<EdgeImmut> => {
    if (edges === null) {
        return false;
    }

    let newEdges: List<EdgeImmut> = List();

    if (typeof edges === 'object') {
        edges.forEach((edge: any) => {
            let weight = 0;
            let from = 0;
            let to = 0;
            let extraAttrs = {};

            if ("weight" in edge) {
                weight = parseFloat(edge.weight);
            }
            if ("from" in edge) {
                from = nodeMap[edge.from];
            }
            if ("to" in edge) {
                to = nodeMap[edge.to];
            }
            if ("attributes" in edge) {
                extraAttrs = filterEdgeExtraAttr(edge.attributes);
            }
            else {
                extraAttrs = filterEdgeExtraAttr(edge);
            }

            newEdges = newEdges.push(new EdgeImmut(from, to, weight, extraAttrs));
        });
    }
    else {
        return false;
    }

    return newEdges;
};

const genericNodesToImmutNodes = (nodes: any): boolean | { nodes: Readonly<List<NodeImmut>>; map: { [key: number]: number } } => {
    if (nodes === null) {
        return false;
    }

    let newNodes: List<NodeImmut> = List();
    const nodeMap: NodeMapping = {};

    if (typeof nodes === "number") {
        // Create the nodes
        for (let i = 0; i < Math.floor(nodes); i++) {
            newNodes = newNodes.set(i, new NodeImmut(i));
            nodeMap[i] = i;
        }
    }
    else if (typeof nodes === 'object') {
        let nodeNum = 0;
        nodes.forEach((n: any) => {
            const id = nodeNum++;
            let label = null;
            let extraAttrs = null;

            if ("label" in n) {
                label = n.label;
            }
            if ("id" in n) {
                nodeMap[n.id] = id;
                if ("label" in n && n.label === n.id.toString()) {
                    label = id.toString();
                }
            }
            else {
                nodeMap[id] = id;
            }
            if ("attributes" in n) {
                extraAttrs = filterNodeExtraAttr(n.attributes);
            }
            else {
                extraAttrs = filterNodeExtraAttr(n);
            }

            newNodes = newNodes.set(id, new NodeImmut(id, label, extraAttrs));
        });
    }
    else {
        return false;
    }

    return { nodes: Object.freeze(newNodes), map: nodeMap };
};

export default class GraphImmut {
    private readonly directed: Readonly<boolean>;
    private readonly weighted: Readonly<boolean>;
    private readonly nodes: Readonly<List<NodeImmut>>;
    private readonly numNodes: Readonly<number>;
    private readonly edges: Readonly<List<EdgeImmut>>;
    private readonly numEdges: Readonly<number>;

    constructor(nodes: number | Readonly<List<NodeImmut>> | NodeImmutPlain[],
        edges: null | Readonly<List<EdgeImmut>> | EdgeImmutPlain[] = null,
        directed = false, weighted = false) {
        this.directed = Object.freeze(directed);
        this.weighted = Object.freeze(weighted);
        let nodeMap = {};

        // Make Nodes
        if (typeof nodes === "number" || (typeof nodes === "object" && !(nodes instanceof List))) {
            const n = genericNodesToImmutNodes(nodes);
            if (typeof n !== "object") {
                throw new Error("Unable to parse node input!");
            }
            this.nodes = n.nodes;
            nodeMap = n.map;
        }
        else if (nodes instanceof List) {
            this.nodes = nodes as List<NodeImmut>;
        }
        else {
            throw new Error("Illegal type of 'node' input to GraphImmut constructor");
        }
        this.nodes = Object.freeze(this.nodes);
        this.numNodes = Object.freeze(this.nodes.size);

        // If we are given edges, add them to the graph
        if (edges !== null && typeof edges === "object" && !(edges instanceof List)) {
            const e = genericEdgesToImmutEdges(edges, nodeMap);
            if (typeof e !== "object") {
                throw new Error("Unable to parse Edge input");
            }
            this.edges = e;
        }
        else if (edges instanceof List) {
            this.edges = edges as List<EdgeImmut>;
        }
        else {
            this.edges = List<EdgeImmut>();
        }
        this.edges = Object.freeze(this.edges);
        this.numEdges = Object.freeze(this.edges.size);

        if (new.target === GraphImmut) {
            Object.freeze(this);
        }
    }

    getNode(id: number, rich = false): NodeImmut | NodeImmutPlain | boolean {
        if (id >= this.numNodes) {
            return false;
        }
        const node = this.nodes.get(id);
        if (typeof node === "undefined") {
            return false;
        }
        if (rich) {
            return node;
        }
        return node.toPlain();
    }

    addNode(data: any = null): GraphImmut {
        if (data === null) {
            data = {};
        }

        const id = this.numNodes;
        if (!("label" in data)) {
            data.label = id.toString();
        }

        const extraAttrs = filterNodeExtraAttr(data);

        return new GraphImmut(this.nodes.set(id, new NodeImmut(id, data.label, extraAttrs)),
            this.edges, this.directed, this.weighted);
    }

    editNode(id: number, data: any): any {
        if (!this.nodes.has(id)) {
            return false;
        }

        const extraAttrs = filterNodeExtraAttr(data);
        if (!("label" in data)) {
            data.label = (this.getNode(id, true) as NodeImmut).getLabel();
        }
        return new GraphImmut(this.nodes.set(id, (this.getNode(id, true) as NodeImmut).editNode(data.label, extraAttrs)),
            this.edges, this.directed, this.weighted);
    }

    deleteNode(id: number): GraphImmut | boolean {
        // Make sure the ID exists
        if (!(id >= 0 && id < this.numNodes)) {
            return false;
        }

        const nodeMap: NodeMapping = {}; // Map for old IDs to new ones since we're deleting an entry

        // Remove it from the node list
        let nodeCount = 0;
        const newNodes: List<NodeImmut> = this.nodes
            .filter((n) => {
                if (n.getID() === id) {
                    nodeMap[n.getID()] = -1;
                }
                else {
                    nodeMap[n.getID()] = nodeCount++;
                }

                return n.getID() !== id;
            })
            .map((node) => {
                let label = node.getLabel();
                if (node.getID().toString() === label) {
                    label = nodeMap[node.getID()].toString();
                }

                return new NodeImmut(nodeMap[node.getID()], label, node.getAllAttributes());
            }) as List<NodeImmut>;

        // Remap edges
        const newEdges: List<EdgeImmut> = this.edges
            .filter((edge) => {
                return !(edge.getFrom() === id || edge.getTo() === id);
            })
            .map((edge) => {
                return new EdgeImmut(nodeMap[edge.getFrom()], nodeMap[edge.getTo()], edge.getWeight(), edge.getAllAttributes());
            }) as List<EdgeImmut>;

        return new GraphImmut(newNodes, newEdges, this.directed, this.weighted);
    }

    addEdge(from: number, to: number, weight: any = 1): GraphImmut {
        if (!this.weighted) {
            weight = 1; // Ensure that edge weights are 1 if this is an unweighted graph
        }

        const newEdges = this.edges.push(new EdgeImmut(from, to, parseFloat(weight)));
        return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
    }

    deleteEdge(from: number, to: number, weight: any = null, deleteAll = true): GraphImmut {
        if (weight !== null) {
            weight = parseFloat(weight);
        }

        let foundOneEdge = false;
        const newEdges: List<EdgeImmut> = this.edges.filter((edge) => {
            // If we're not deleting everything and we have found one edge, then do not filter anymore
            if (foundOneEdge && !deleteAll) {
                return true;
            }

            // If we have an exact match
            if (edge.getFrom() === from && edge.getTo() === to && (weight === null || edge.getWeight() === weight)) {
                foundOneEdge = true;
                return false; // Remove this edge
            }

            // If we are undirected, check for opposing matches
            if (!this.directed) {
                if (edge.getFrom() === to && edge.getTo() === from && (weight === null || edge.getWeight() === weight)) {
                    foundOneEdge = true;
                    return false; // Remove this edge
                }
            }

            return true;
        }) as List<EdgeImmut>;

        return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
    }

    editEdge(from: number, to: number, newWeight: any, oldWeight: any = null, color: string | null = null): GraphImmut | boolean {
        let foundFirst = false;

        if (oldWeight !== null) {
            oldWeight = parseFloat(oldWeight);
        }

        let newEdges = this.edges;
        this.edges.forEach((edge, index) => {
            if (foundFirst) {
                return;
            }

            if (((edge.getFrom() === from && edge.getTo() === to)
                || (!this.isDirected() && edge.getFrom() === to && edge.getTo() === from))
                && (oldWeight === null || edge.getWeight() === oldWeight)) {

                if (color !== null) {
                    newEdges = newEdges.set(index,
                        edge.editEdge(newWeight === null ? null : parseFloat(newWeight),
                            { color: color }));
                }
                else {
                    newEdges = newEdges.set(index, edge.editEdge(newWeight === null ? null : parseFloat(newWeight)));
                }
                foundFirst = true;
            }
        });

        return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
    }

    getAllNodes(rich = false): NodeImmut[] | NodeImmutPlain[] {
        if (rich) {
            return this.nodes.toArray();
        }
        return this.nodes.map((node) => {
            return node.toPlain();
        }).toArray();
    }

    getAllNodesAsImmutableList(): Readonly<List<NodeImmut>> {
        return this.nodes;
    }

    getAllEdgesAsImmutableList(): Readonly<List<EdgeImmut>> {
        return this.edges;
    }

    getAllEdges(rich = false): EdgeImmut[] | EdgeImmutPlain[] {
        if (rich) {
            return this.edges.toArray();
        }
        return this.edges.map((edge) => {
            return edge.toPlain();
        }).toArray();
    }

    getNumberOfNodes(): number {
        return this.numNodes;
    }

    getNumberOfEdges(): number {
        return this.numEdges;
    }

    getAllOutDegrees(): number[] {
        const degrees: number[] = [];
        this.nodes.forEach((_, i) => {
            degrees[i] = 0;
        });
        this.edges.forEach((edge) => {
            degrees[edge.getFrom()]++;
        });

        return degrees;
    }

    asWeighted(): GraphImmut {
        return new GraphImmut(this.nodes, this.edges.map((edge) => {
            return edge.editEdge(1);
        }) as List<EdgeImmut>, this.directed, true);
    }

    asUnweighted(): GraphImmut {
        return new GraphImmut(this.nodes, this.edges.map((edge) => {
            return edge.editEdge(1);
        }) as List<EdgeImmut>, this.directed, false);
    }

    asDirected(doubleEdges = false): GraphImmut {
        if (!doubleEdges) {
            return new GraphImmut(this.nodes, this.edges, true, this.weighted);
        }

        let newEdges = this.edges;
        this.edges.forEach((edge) => {
            newEdges = newEdges.push(new EdgeImmut(edge.getTo(), edge.getFrom(), edge.getWeight(), edge.getAllAttributes()));
        });

        return new GraphImmut(this.nodes, newEdges, true, this.weighted);
    }

    asUndirected(): GraphImmut {
        let newEdges: List<EdgeImmut> = List();
        const addedEdges: { [key: string]: null } = {};

        this.edges.forEach((edge) => {
            let from = edge.getFrom();
            let to = edge.getTo();
            if (to < from) {
                from = to;
                to = edge.getFrom();
            }
            if (!(`${from}_${to}` in addedEdges)) {
                addedEdges[`${from}_${to}`] = null;
                newEdges = newEdges.push(new EdgeImmut(from, to, edge.getWeight(), edge.getAllAttributes()));
            }
        });

        return new GraphImmut(this.nodes, newEdges, false, this.weighted);
    }

    asChangedDirectedWeighted(directed: boolean, weighted: boolean): GraphImmut {
        let G: GraphImmut = this;
        if (directed && !this.directed) {
            G = G.asDirected();
        }
        else if (!directed && this.directed) {
            G = G.asUndirected();
        }

        if (weighted && !this.weighted) {
            G = G.asWeighted();
        }
        else if (!weighted && this.weighted) {
            G = G.asUnweighted();
        }

        return G;
    }

    getNodeAdjacency(id: number): number[] {
        const adj: number[] = [];
        this.edges.forEach((edge) => {
            if (edge.getFrom() === id) {
                adj.push(edge.getTo());
            }
            else if (!this.directed && edge.getTo() === id) {
                adj.push(edge.getFrom());
            }
        });

        return adj;
    }

    getFullAdjacency(): number[][] {
        const adj: number[][] = [];
        this.nodes.forEach((n) => {
            adj[n.getID()] = this.getNodeAdjacency(n.getID());
        });

        return adj;
    }

    areAdjacent(id1: number, id2: number): boolean {
        return this.getNodeAdjacency(id1).includes(id2);
    }

    getEdgesBetween(id1: number, id2: number): EdgeImmut[] {
        const edgeList: EdgeImmut[] = [];
        if (id1 >= this.numNodes || id2 >= this.numNodes) {
            return edgeList;
        }

        this.edges.forEach((edge) => {
            if (!this.directed && edge.getFrom() === id2 && edge.getTo() === id1) {
                edgeList.push(edge);
            }

            if (edge.getFrom() === id1 && edge.getTo() === id2) {
                edgeList.push(edge);
            }
        });

        return edgeList;
    }

    getMinWeightEdgeBetween(id1: number, id2: number): number {
        let minWeight = Infinity;
        this.getEdgesBetween(id1, id2).forEach((edge) => {
            if (edge.getWeight() < minWeight) {
                minWeight = edge.getWeight();
            }
        });

        return minWeight;
    }

    // Take a multigraph and reduce all multiple edges to a single edge, weighted using the reducer
    reduceMultiGraph(reducer: (a: number, b: number) => number = Math.min, initialValue: any = Infinity): GraphImmut {
        const multiEdges: EdgeImmutPlain[] = [];
        this.nodes.forEach((node) => {
            // If we have duplicates
            const adj = this.getNodeAdjacency(node.getID());
            const uniques = new Set(adj);
            if (uniques.size < adj.length) {
                uniques.forEach((to) => {
                    const newWeight = this.getEdgesBetween(node.getID(), to).reduce((acc, edge) => {
                        return reducer(acc, edge.getWeight());
                    }, initialValue);

                    multiEdges.push({ from: node.getID(), to, weight: parseFloat(newWeight) });
                });
            }
        });

        // Remove all multigraph edges and replace them with single new edges
        let newEdges = this.edges.filter((edge) => {
            let keep = true;
            multiEdges.forEach((duplicateEdge) => {
                if (edge.getFrom() === duplicateEdge.from && edge.getTo() === duplicateEdge.to) {
                    keep = false;
                }
            });

            return keep;
        }) as List<EdgeImmut>;
        multiEdges.forEach((edge) => {
            newEdges = newEdges.push(new EdgeImmut(edge.from, edge.to, edge.weight));
        });

        return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
    }

    isWeighted() {
        return this.weighted;
    }

    isDirected() {
        return this.directed;
    }
}
