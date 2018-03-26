"use strict";

import $ from 'jquery';
import {DataSet} from 'vis/index-network';
import help from './genericHelpers';
import GraphImmut from './GraphImmut/GraphImmut';

let self = {
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
        window.main.setData({nodes: self.clearColorFromNodes(graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    addNode: (data, graph = self.graph) => {
        graph = graph.addNode({label: data.label, x: data.x, y: data.y});
        window.main.setData({nodes: self.clearColorFromNodes(graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    editNode: (id, label, graph = self.graph) => {
        graph = graph.editNode(id, {label: label});
        window.main.setData(self.getGraphData(graph), false, false);
    },

    editEdge: (from, to, newWeight, oldWeight, graph = self.graph) => {
        graph = graph.editEdge(from, to, newWeight, oldWeight);
        window.main.setData(self.getGraphData(graph), false, false);
    },

    deleteEdge: (from, to, weight = null, graph = self.graph) => {
        graph = graph.deleteEdge(from, to, weight, false);
        window.main.setData({nodes: self.clearColorFromNodes(graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    deleteNode: (id, graph = self.graph) => {
        graph = graph.deleteNode(id);
        window.main.setData({nodes: self.clearColorFromNodes(graph.getAllNodes()), edges: graph.getAllEdges()});
    },

    clearColorFromNodes: (nodes) => {
        nodes.forEach((v) => {
            v.color = null;
        });
        return nodes;
    },

    nodeIDToLabel: (id, graph = self.graph) => {
        let n = graph.getNode(id, true);
        if (n !== false && n !== null && typeof n !== "undefined" && n.getLabel().trim().length > 0) {
            return n.getLabel().trim();
        }

        return id.toString();
    },

    // Preferentially search by ID, label, and case-insensitive label
    nodeLabelToID: (label, graph = self.graph) => {
        let n = graph.getAllNodes(true);
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
        Object.keys(locations).forEach((i) => {
            let v = locations[i];
            graph = graph.editNode(i, {x: v.x, y: v.y});
        });

        return graph;
    },

    getGraphData: (graph = self.graph, clearColors = false) => {
        return {
            nodes: clearColors ? self.clearColorFromNodes(graph.getAllNodes()) : graph.getAllNodes(),
            edges: graph.getAllEdges(),
            directed: graph.isDirected(),
            weighted: graph.isWeighted()
        };
    },

    // return graph object built from input nodes and edges
    dataSetToGraph: (nodes, edges, directional = false, weighted = false) => {
        let d = self.alignData(0, nodes, edges);
        return new GraphImmut(d.nodes, d.edges, directional, weighted);
    },

    // Align ID's of nodes to a start value (typically 0)
    alignData: (start, nodes, edges) => {
        let nodeMap = {};
        let nodeCount = start;
        let newNodes = [];
        nodes.forEach((v) => {
            let label = v.label;
            if (v.label === v.id.toString()) {
                label = nodeCount.toString();
            }
            let thisNode = {id: nodeCount, label: label, color: v.color, x: v.x, y: v.y};
            newNodes.push(thisNode);
            nodeMap[v.id] = nodeCount++;
        });

        let newEdges = [];
        edges.forEach((v) => {
            let thisEdge = {from: nodeMap[v.from], to: nodeMap[v.to], label: v.label, weight: v.weight};
            newEdges.push(thisEdge);
        });

        return help.deepFreeze({nodes: newNodes, edges: newEdges});
    },
};

export default self;
