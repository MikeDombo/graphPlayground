"use strict";

import { DataSet } from 'vis-data';
import { Node, Edge } from 'vis-network';
import help from './util/genericHelpers';
import GraphImmut from './classes/GraphImmut/GraphImmut';
import { EdgeImmutPlain } from "./classes/GraphImmut/EdgeImmut";
import NodeImmut, { NodeImmutPlain } from "./classes/GraphImmut/NodeImmut";
import { GraphPlain } from "./util/predefinedGraphs";

interface UpToDateProperties {
    name: string;
    upToDate: boolean;
    type: string;
    always?: boolean;
    applyFunc?: (ignoreDuplicate?: boolean) => any;
    [index: string]: undefined | string | boolean | ((ignoreDuplicate?: boolean) => any)
}

interface GraphProperties {
    vertices: number;
    edges: number;
    eulerian: boolean;
    "Chromatic Number": number | null;
    "Connected Components": number | null;
    "Strongly Connected Components": number | null;
    cyclic: boolean;

    [index: string]: boolean | number | null;
}

interface GraphStateData {
    stronglyConnectedComponents: null | { [key: number]: number };
    connectedComponents: null | { [key: number]: number };
    graphColoring: null | number[];

    [index: string]: null | number[] | { [key: number]: number };
}

export interface AddNodeI {
    id?: number
    label: string;
    x: number;
    y: number;
    color?: string;
}

export interface GraphStateHistory {
    upToDate: UpToDateProperties[];
    state: GraphStateData;
    graph: GraphImmut;
    graphProperties: GraphProperties;
    [index: string]: UpToDateProperties[] | GraphStateData | GraphImmut | GraphProperties;
}

const getInt = (v: string | number): number => {
    if (typeof v === 'number') {
        return v;
    }
    return parseInt(v);
};

export default class GraphState {
    public static workerPool: (Worker | null)[] = [];
    public static backHistory: GraphStateHistory[] = [];
    public static forwardHistory: GraphStateHistory[] = [];
    public static maxHistory = 10;
    public static upToDate: UpToDateProperties[] = [
        {
            name: "Chromatic Number", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintGraphColoring();
            }
        },
        {
            name: "graphColoring", upToDate: false, type: "state",
            applyFunc: () => {
                return window.ui.makeAndPrintGraphColoring();
            }
        },
        { name: "vertices", upToDate: true, always: true, type: "property" },
        { name: "edges", upToDate: true, always: true, type: "property" },
        {
            name: "eulerian", upToDate: false, type: "property",
            applyFunc: (i) => {
                return window.ui.makeAndPrintEulerian(i);
            }
        },
        {
            name: "Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.getAlgorithms().find((v) => v.name === 'Connected Components')!.applyFunc();
            }
        },
        {
            name: "connectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                window.ui.getAlgorithms().find((v) => v.name === 'Connected Components')!.applyFunc();
            }
        },
        {
            name: "Strongly Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.getAlgorithms().find((v) => v.name === 'Strongly Connected Components')!.applyFunc();
            }
        },
        {
            name: "stronglyConnectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                window.ui.getAlgorithms().find((v) => v.name === 'Strongly Connected Components')!.applyFunc();
            }
        },
        {
            name: "cyclic", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintIsCyclic();
            }
        },
    ];
    public static state: GraphStateData = {
        stronglyConnectedComponents: null,
        connectedComponents: null,
        graphColoring: null,
    };
    public static graph: GraphImmut;
    public static graphProperties: GraphProperties = {
        vertices: 0,
        edges: 0,
        eulerian: false,
        "Chromatic Number": null,
        "Connected Components": null,
        "Strongly Connected Components": null,
        cyclic: false,
    };

    static setUpToDate(value = false, listOptions?: string[]) {
        const all = listOptions === null || typeof listOptions === "undefined";
        let property = false;
        GraphState.upToDate.forEach((v) => {
            if ((!("always" in v) || !v.always) && (all || listOptions!.indexOf(v.name) > -1)) {
                v.upToDate = value;
                if (v.type === "property") {
                    property = true;
                }
            }
        });
        if (property) {
            GraphState.makeAndPrintProperties();
        }
    }

    static async getProperty(property: keyof GraphProperties, updateIfNotUpdated = false, ignoreDuplicate = false): Promise<any> {
        const a = GraphState.upToDate.find((v) => {
            return ("name" in v && v.name === property);
        })!;
        if (!a.upToDate) {
            if ("applyFunc" in a && typeof a.applyFunc === "function" && updateIfNotUpdated) {
                await a.applyFunc(ignoreDuplicate);
            }
            else {
                return null;
            }
        }
        if (a.type === "state") {
            return Promise.resolve(GraphState.state[property]);
        }
        return Promise.resolve(GraphState.graphProperties[property]);
    }

    static async makeAndPrintProperties(recalcLong = false) {
        const directional = window.settings.getOption("direction");

        GraphState.graphProperties.vertices = GraphState.graph.getNumberOfNodes();
        GraphState.graphProperties.edges = GraphState.graph.getNumberOfEdges();

        if (!directional) {
            await GraphState.getProperty("eulerian", true, true);
        }

        const p = Object.keys(GraphState.graphProperties);
        if (recalcLong) {
            p.forEach(async (v) => {
                await GraphState.getProperty(v, true);
            });
        }

        const printableProperties: any = {};
        await Promise.all(p.map(async (v) => {
            printableProperties[v] = await GraphState.getProperty(v);
        }));

        GraphState.printGraphProperties(printableProperties);
    }

    static printGraphProperties(properties: any) {
        let p = "";
        Object.keys(properties).forEach((k) => {
            if (properties[k] !== null) {
                p += `${help.toTitleCase(k)}: ${properties[k]}\n`;
            }
        });
        p = p.trim();
        p = help.htmlEncode(p);
        document.getElementById("graphProps")!.innerHTML = `<p class='nav-link'>${p}</p>`;
    }

    private static updateGraph(graph = GraphState.graph) {
        let nodes = graph.getAllNodes() as NodeImmutPlain[];
        let edges = graph.getAllEdges() as EdgeImmutPlain[];
        if (!window.settings.getOption("customColors")) {
            nodes = GraphState.clearColorFromNodes(nodes);
            edges = GraphState.clearColorFromEdges(edges);
        }
        window.main.setData({ nodes, edges });
    }

    static addEdge(from: number | string, to: number | string, weight = 0, graph = GraphState.graph) {
        const edgeFrom = getInt(from);
        const edgeTo = getInt(to);
        graph = graph.addEdge(edgeFrom, edgeTo, weight);
        this.updateGraph(graph);
    }

    static addNode(data: AddNodeI, graph = GraphState.graph) {
        graph = graph.addNode({ label: data.label, x: data.x, y: data.y, color: data.color });
        this.updateGraph(graph);
    }

    static editNode(id: number | string, label: string, color?: string, graph = GraphState.graph) {
        const iId = getInt(id);
        graph = graph.editNode(iId, { label, color });
        window.main.setData(GraphState.getGraphData(graph), false, false);
    }

    static editEdge(from: number | string, to: number | string,
        newWeight: number, oldWeight: number, graph = GraphState.graph) {
        const edgeFrom = getInt(from);
        const edgeTo = getInt(to);
        const newGraph = graph.editEdge(edgeFrom, edgeTo, newWeight, oldWeight);
        if (newGraph instanceof GraphImmut) {
            window.main.setData(GraphState.getGraphData(newGraph), false, false);
        }
    }

    static deleteEdge(from: number | string, to: number | string, weight: (undefined | null | number) = null, graph = GraphState.graph) {
        const edgeFrom = getInt(from);
        const edgeTo = getInt(to);
        graph = graph.deleteEdge(edgeFrom, edgeTo, weight, false);
        this.updateGraph(graph);
    }

    static deleteNode(id: number | string, graph = GraphState.graph) {
        const iId = getInt(id);
        const newGraph = graph.deleteNode(iId);
        if (newGraph instanceof GraphImmut) {
            this.updateGraph(newGraph);
        }
    }

    static clearColorFromNodes(nodes: NodeImmutPlain[]): NodeImmutPlain[] {
        nodes.forEach((v) => {
            v.color = null;
        });
        return nodes;
    }

    static clearColorFromEdges(edges: EdgeImmutPlain[]): EdgeImmutPlain[] {
        edges.forEach((v) => {
            delete v.color;
        });
        return edges;
    }

    static nodeIDToLabel(id: number, graph = GraphState.graph): string {
        const n = graph.getNode(id, true);
        if (n !== false && n !== null && n instanceof NodeImmut && n.getLabel().trim().length > 0) {
            return n.getLabel().trim();
        }

        return id.toString();
    }

    // Preferentially search by ID, label, and case-insensitive label
    static nodeLabelToID(label: string, graph = GraphState.graph) {
        let n = graph.getAllNodes(true) as NodeImmut[];
        n = n.filter((node) => {
            return node.getLabel().toLowerCase() === label.toLowerCase() || node.getID().toString() === label;
        });

        if (n.length === 0) {
            return -1;
        }
        else if (n.length === 1) {
            return n[0].getID();
        }

        let rID = -1;
        let found = false;

        n.forEach((node) => {
            if (!found && node.getID().toString() === label) {
                rID = node.getID();
                found = true;
            }
        });

        if (found) {
            return rID;
        }

        n.forEach((node) => {
            if (!found && node.getLabel() === label) {
                rID = node.getID();
                found = true;
            }
        });

        if (found) {
            return rID;
        }

        n.forEach((node) => {
            if (!found && node.getLabel().toLowerCase() === label.toLowerCase()) {
                rID = node.getID();
                found = true;
            }
        });

        return rID;
    }

    // Return graph as a Vis compatible dataset
    static getGraphAsDataSet(graph: GraphImmut): { nodes: DataSet<Node>; edges: DataSet<Edge> } {
        const d = GraphState.getGraphData(graph);
        if (graph.isWeighted()) {
            d.edges.forEach((e) => {
                e.label = e.weight.toString();
            });
        }
        d.edges.forEach((e) => {
            if ('color' in e) {
                e.color = { color: e.color };
            }
        });

        return { nodes: new DataSet(d.nodes as Node[]), edges: new DataSet(d.edges as Edge[]) };
    }

    static setLocations(locations: { [key: string]: { x: number; y: number } }, graph = GraphState.graph): GraphImmut {
        let newNodes = graph.getAllNodesAsImmutableList();
        Object.keys(locations).forEach((i) => {
            const v = locations[i];
            const node = newNodes.get(parseInt(i))!;
            // Only change when there is actually a new position
            if (node.getAttribute("x") !== v.x || node.getAttribute("y") !== v.y) {
                // Batch up all changes that we'll be making
                newNodes = newNodes.set(parseInt(i), node.editNode(node.getLabel(), { x: v.x, y: v.y }));
            }
        });

        return new GraphImmut(newNodes, graph.getAllEdgesAsImmutableList(), graph.isDirected(), graph.isWeighted());
    }

    static getGraphData(graph = GraphState.graph, clearNodeColors = false, clearEdgeColors = false): GraphPlain {
        const nodes = graph.getAllNodes() as NodeImmutPlain[];
        const edges = graph.getAllEdges() as EdgeImmutPlain[];
        return {
            nodes: clearNodeColors ? GraphState.clearColorFromNodes(nodes) : nodes,
            edges: clearEdgeColors ? GraphState.clearColorFromEdges(edges) : edges,
            directed: graph.isDirected(),
            weighted: graph.isWeighted()
        };
    }
}
