"use strict";

import * as $ from 'jquery';
import {DataSet} from 'vis/index-network';
import help from './genericHelpers';
import GraphImmut from './GraphImmut/GraphImmut';
import {EdgeImmutPlain} from "./GraphImmut/EdgeImmut";
import NodeImmut, {NodeImmutPlain} from "./GraphImmut/NodeImmut";

declare interface GraphProperties {
    name: string;
    upToDate: boolean;
    type: string;
    always?: boolean;
    applyFunc?: () => Promise<any>;
}

export default class GraphState {
    public static backHistory: any = [];
    public static forwardHistory: any = [];
    public static maxHistory = 10;
    public static upToDate: GraphProperties[] = [
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
        {name: "vertices", upToDate: true, always: true, type: "property"},
        {name: "edges", upToDate: true, always: true, type: "property"},
        {
            name: "eulerian", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintEulerian();
            }
        },
        {
            name: "Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintConnectedComponents();
            }
        },
        {
            name: "connectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                return window.ui.makeAndPrintConnectedComponents();
            }
        },
        {
            name: "Strongly Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintStronglyConnectedComponents();
            }
        },
        {
            name: "stronglyConnectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                return window.ui.makeAndPrintStronglyConnectedComponents();
            }
        },
        {
            name: "cyclic", upToDate: false, type: "property",
            applyFunc: () => {
                return window.ui.makeAndPrintIsCyclic();
            }
        },
    ];
    public static state = {
        stronglyConnectedComponents: null,
        connectedComponents: null,
        graphColoring: null,
    };
    public static graph: GraphImmut = null;
    public static graphProperties = {
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
            if ((!("always" in v) || !v.always) && (all || listOptions.indexOf(v.name) > -1)) {
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

    static async getProperty(property: string, updateIfNotUpdated = false): Promise<any> {
        const a = GraphState.upToDate.find((v) => {
            return ("name" in v && v.name === property);
        });
        if (!a.upToDate) {
            if ("applyFunc" in a && updateIfNotUpdated) {
                await a.applyFunc();
            }
            else {
                return Promise.resolve(null);
            }
        }
        if (a.type === "state") {
            return Promise.resolve(GraphState.state[property]);
        }
        return Promise.resolve(GraphState.graphProperties[property]);
    }

    static getPropertyImm(property: string): any {
        const a = GraphState.upToDate.find((v) => {
            return ("name" in v && v.name === property);
        });
        if (!a.upToDate) {
            return null;
        }
        if (a.type === "state") {
            return GraphState.state[property];
        }
        return GraphState.graphProperties[property];
    }

    static async makeAndPrintProperties(recalcLong = false) {
        const directional = window.settings.getOption("direction");

        GraphState.graphProperties.vertices = GraphState.graph.getNumberOfNodes();
        GraphState.graphProperties.edges = GraphState.graph.getNumberOfEdges();

        if (!directional) {
            await GraphState.getProperty("eulerian", true);
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
        $("#graphProps").html(`<p class='nav-link'>${p}</p>`);
    }

    static addEdge(from, to, weight = 0, graph = GraphState.graph) {
        graph = graph.addEdge(from, to, weight);
        window.main.setData({
            nodes: GraphState.clearColorFromNodes(graph.getAllNodes() as NodeImmutPlain[]),
            edges: graph.getAllEdges() as EdgeImmutPlain[]
        });
    }

    static addNode(data, graph = GraphState.graph) {
        graph = graph.addNode({label: data.label, x: data.x, y: data.y});
        window.main.setData({
            nodes: GraphState.clearColorFromNodes(graph.getAllNodes() as NodeImmutPlain[]),
            edges: graph.getAllEdges() as EdgeImmutPlain[]
        });
    }

    static editNode(id, label, graph = GraphState.graph) {
        graph = graph.editNode(id, {label});
        window.main.setData(GraphState.getGraphData(graph), false, false);
    }

    static editEdge(from, to, newWeight, oldWeight, graph = GraphState.graph) {
        const newGraph = graph.editEdge(from, to, newWeight, oldWeight);
        if (newGraph instanceof GraphImmut) {
            window.main.setData(GraphState.getGraphData(newGraph), false, false);
        }
    }

    static deleteEdge(from, to, weight = null, graph = GraphState.graph) {
        graph = graph.deleteEdge(from, to, weight, false);
        window.main.setData({
            nodes: GraphState.clearColorFromNodes(graph.getAllNodes() as NodeImmutPlain[]),
            edges: graph.getAllEdges() as EdgeImmutPlain[]
        });
    }

    static deleteNode(id, graph = GraphState.graph) {
        const newGraph = graph.deleteNode(id);
        if (newGraph instanceof GraphImmut) {
            window.main.setData({
                nodes: GraphState.clearColorFromNodes(newGraph.getAllNodes() as NodeImmutPlain[]),
                edges: newGraph.getAllEdges() as EdgeImmutPlain[]
            });
        }
    }

    static clearColorFromNodes(nodes: NodeImmutPlain[]) {
        nodes.forEach((v) => {
            v.color = null;
        });
        return nodes;
    }

    static nodeIDToLabel(id, graph = GraphState.graph) {
        const n = graph.getNode(id, true);
        if (n !== false && n !== null && n instanceof NodeImmut && n.getLabel().trim().length > 0) {
            return n.getLabel().trim();
        }

        return id.toString();
    }

    // Preferentially search by ID, label, and case-insensitive label
    static nodeLabelToID(label, graph = GraphState.graph) {
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
    static getGraphAsDataSet(graph) {
        const d = GraphState.getGraphData(graph);
        if (graph.isWeighted()) {
            d.edges.forEach((e) => {
                e.label = e.weight.toString();
            });
        }

        return {nodes: new DataSet(d.nodes), edges: new DataSet(d.edges)};
    }

    static setLocations(locations, graph = GraphState.graph) {
        let newNodes = graph.getAllNodesAsImmutableList();
        Object.keys(locations).forEach((i) => {
            const v = locations[i];
            const node = newNodes.get(parseInt(i));
            // Only change when there is actually a new position
            if (node.getAttribute("x") !== v.x || node.getAttribute("y") !== v.y) {
                // Batch up all changes that we'll be making
                newNodes = newNodes.set(parseInt(i), node.editNode(node.getLabel(), {x: v.x, y: v.y}));
            }
        });

        return new GraphImmut(newNodes, graph.getAllEdgesAsImmutableList(), graph.isDirected(), graph.isWeighted());
    }

    static getGraphData(graph = GraphState.graph, clearColors = false): GraphPlain {
        const nodes = graph.getAllNodes() as NodeImmutPlain[];
        return {
            nodes: clearColors ? GraphState.clearColorFromNodes(nodes) : nodes,
            edges: graph.getAllEdges() as EdgeImmutPlain[],
            directed: graph.isDirected(),
            weighted: graph.isWeighted()
        };
    }
}
