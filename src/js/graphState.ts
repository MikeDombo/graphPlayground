"use strict";

import * as $ from 'jquery';
import {DataSet} from 'vis/index-network';
import help from './genericHelpers';
import GraphImmut from './GraphImmut/GraphImmut';
import {EdgeImmutPlain} from "./GraphImmut/EdgeImmut";
import NodeImmut, {NodeImmutPlain} from "./GraphImmut/NodeImmut";

export interface graphStateI {
    backHistory: any[];
    forwardHistory: any[];
    maxHistory: number;
    upToDate: ({ name: string; upToDate: boolean; type: string; applyFunc: () => void } | { name: string; upToDate: boolean; always: boolean; type: string })[];
    state: { stronglyConnectedComponents: null; connectedComponents: null; graphColoring: null };
    graph: GraphImmut;
    graphProperties: { vertices: number; edges: number; eulerian: boolean; "Chromatic Number": null; "Connected Components": null; "Strongly Connected Components": null; cyclic: boolean };
    setUpToDate: (value: boolean, listOptions?: string[]) => void;
    getProperty: (property: string, updateIfNotUpdated?: boolean) => any;
    makeAndPrintProperties: (recalcLong?: boolean) => void;
    printGraphProperties: (properties: {}) => void;
    addEdge: (from: number, to: number, weight?: number, graph?: GraphImmut) => void;
    addNode: (data, graph?: GraphImmut) => void;
    editNode: (id: number, label: string, graph?: GraphImmut) => void;
    editEdge: (from: number, to: number, newWeight: number, oldWeight: number, graph?: GraphImmut) => void;
    deleteEdge: (from: number, to: number, weight?: any, graph?: GraphImmut) => void;
    deleteNode: (id: number, graph?: GraphImmut) => void;
    clearColorFromNodes: (nodes: NodeImmutPlain[]) => NodeImmutPlain[];
    nodeIDToLabel: (id: number, graph?: GraphImmut) => string;
    nodeLabelToID: (label: string, graph?: GraphImmut) => number;
    getGraphAsDataSet: (graph: GraphImmut) => { nodes: DataSet<any>; edges: DataSet<any> };
    setLocations: (locations: any, graph?: GraphImmut) => GraphImmut;
    getGraphData: (graph?: GraphImmut, clearColors?: boolean) => GraphPlain;
}

let self: graphStateI = {
    backHistory: [],
    forwardHistory: [],
    maxHistory: 10,
    upToDate: [
        {
            name: "Chromatic Number", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.makeAndPrintGraphColoring();
            }
        },
        {
            name: "graphColoring", upToDate: false, type: "state",
            applyFunc: () => {
                window.ui.makeAndPrintGraphColoring();
            }
        },
        {name: "vertices", upToDate: true, always: true, type: "property"},
        {name: "edges", upToDate: true, always: true, type: "property"},
        {
            name: "eulerian", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.makeAndPrintEulerian();
            }
        },
        {
            name: "Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.makeAndPrintConnectedComponents();
            }
        },
        {
            name: "connectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                window.ui.makeAndPrintConnectedComponents();
            }
        },
        {
            name: "Strongly Connected Components", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.makeAndPrintStronglyConnectedComponents();
            }
        },
        {
            name: "stronglyConnectedComponents", upToDate: false, type: "state",
            applyFunc: () => {
                window.ui.makeAndPrintStronglyConnectedComponents();
            }
        },
        {
            name: "cyclic", upToDate: false, type: "property",
            applyFunc: () => {
                window.ui.makeAndPrintIsCyclic();
            }
        },
    ],
    state: {
        stronglyConnectedComponents: null,
        connectedComponents: null,
        graphColoring: null,
    },
    graph: null,
    graphProperties: {
        vertices: 0,
        edges: 0,
        eulerian: false,
        "Chromatic Number": null,
        "Connected Components": null,
        "Strongly Connected Components": null,
        cyclic: false,
    },

    setUpToDate: (value = false, listOptions) => {
        let all = listOptions === null || typeof listOptions === "undefined";
        let property = false;
        self.upToDate.forEach((v) => {
            if ((!("always" in v) || !v.always) && (all || listOptions.indexOf(v.name) > -1)) {
                v.upToDate = value;
                if (v.type === "property") {
                    property = true;
                }
            }
        });
        if (property) {
            self.makeAndPrintProperties();
        }
    },

    getProperty: (property, updateIfNotUpdated = false) => {
        let a = self.upToDate.find((v) => {
            return ("name" in v && v.name === property);
        });
        if (!a.upToDate) {
            if ("applyFunc" in a && updateIfNotUpdated) {
                a.applyFunc();
            }
            else {
                return null;
            }
        }
        if (a.type === "state") {
            return self.state[property];
        }
        return self.graphProperties[property];
    },

    makeAndPrintProperties: (recalcLong = false) => {
        let directional = window.settings.getOption("direction");

        self.graphProperties.vertices = self.graph.getNumberOfNodes();
        self.graphProperties.edges = self.graph.getNumberOfEdges();

        if (!directional) {
            self.getProperty("eulerian", true);
        }

        let p = Object.keys(self.graphProperties);
        if (recalcLong) {
            p.forEach((v) => {
                self.getProperty(v, true);
            });
        }

        let printableProperties = {};
        p.forEach((v) => {
            printableProperties[v] = self.getProperty(v);
        });
        self.printGraphProperties(printableProperties);
    },

    printGraphProperties: (properties) => {
        let p = "";
        Object.keys(properties).forEach((k) => {
            if (properties[k] !== null) {
                p += help.toTitleCase(k) + ": " + properties[k] + "\n";
            }
        });
        p = p.trim();
        p = help.htmlEncode(p);
        $("#graphProps").html("<p class='nav-link'>" + p + "</p>");
    },

    addEdge: (from, to, weight = 0, graph = self.graph) => {
        graph = graph.addEdge(from, to, weight);
        window.main.setData({nodes: self.clearColorFromNodes(<NodeImmutPlain[]> graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    addNode: (data, graph = self.graph) => {
        graph = graph.addNode({label: data.label, x: data.x, y: data.y});
        window.main.setData({nodes: self.clearColorFromNodes(<NodeImmutPlain[]> graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    editNode: (id, label, graph = self.graph) => {
        graph = graph.editNode(id, {label: label});
        window.main.setData(self.getGraphData(graph), false, false);
    },

    editEdge: (from, to, newWeight, oldWeight, graph = self.graph) => {
        let newGraph = graph.editEdge(from, to, newWeight, oldWeight);
        if (newGraph instanceof GraphImmut) {
            window.main.setData(self.getGraphData(newGraph), false, false);
        }
    },

    deleteEdge: (from, to, weight = null, graph = self.graph) => {
        graph = graph.deleteEdge(from, to, weight, false);
        window.main.setData({
            nodes: self.clearColorFromNodes(<NodeImmutPlain[]>graph.getAllNodes()),
            edges: graph.getAllEdges()
        });
    },

    deleteNode: (id, graph = self.graph) => {
        let newGraph = graph.deleteNode(id);
        if (newGraph instanceof GraphImmut) {
            window.main.setData({
                nodes: self.clearColorFromNodes(<NodeImmutPlain[]> newGraph.getAllNodes()),
                edges: newGraph.getAllEdges()
            });
        }
    },

    clearColorFromNodes: (nodes: NodeImmutPlain[]) => {
        nodes.forEach((v) => {
            v.color = null;
        });
        return nodes;
    },

    nodeIDToLabel: (id, graph = self.graph) => {
        let n = <NodeImmut | boolean> graph.getNode(id, true);
        if (n !== false && n !== null && n instanceof NodeImmut && n.getLabel().trim().length > 0) {
            return n.getLabel().trim();
        }

        return id.toString();
    },

    // Preferentially search by ID, label, and case-insensitive label
    nodeLabelToID: (label, graph = self.graph) => {
        let n: NodeImmut[] = <NodeImmut[]> graph.getAllNodes(true);
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
    },

    // Return graph as a Vis compatible dataset
    getGraphAsDataSet: (graph) => {
        let d = self.getGraphData(graph);
        if (graph.isWeighted()) {
            d.edges.forEach((e) => {
                e.label = e.weight.toString();
            });
        }

        return {nodes: new DataSet(d.nodes), edges: new DataSet(d.edges)};
    },

    setLocations: (locations, graph = self.graph) => {
        let newNodes = graph.getAllNodesAsImmutableList();
        Object.keys(locations).forEach((i) => {
            let v = locations[i];
            let node = newNodes.get(parseInt(i));
            // Only change when there is actually a new position
            if (node.getAttribute("x") !== v.x || node.getAttribute("y") !== v.y) {
                // Batch up all changes that we'll be making
                newNodes = newNodes.set(parseInt(i), node.editNode(node.getLabel(), {x: v.x, y: v.y}));
            }
        });

        return new GraphImmut(newNodes, graph.getAllEdgesAsImmutableList(), graph.isDirected(), graph.isWeighted());
    },

    getGraphData: (graph = self.graph, clearColors = false): GraphPlain => {
        let nodes = <NodeImmutPlain[]> graph.getAllNodes();
        return {
            nodes: clearColors ? self.clearColorFromNodes(nodes) : nodes,
            edges: <EdgeImmutPlain[]> graph.getAllEdges(),
            directed: graph.isDirected(),
            weighted: graph.isWeighted()
        };
    }
};

export default self;
