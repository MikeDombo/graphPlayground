"use strict";

import $ from 'jquery';
import help from './genericHelpers';
import settings from './settings';
import randomColor from 'randomcolor';
import graphState from './graphState';
import GraphImmut from "./GraphImmut/GraphImmut";

let self = {
    graphState: graphState,
    container: document.getElementById('network'),
    // Function used to overwrite the edge edit functionality when weights are active
    visWeightEdgeEdit: (data, callback) => {
        help.showFormModal(($modal, vals) => {
            callback(null);
            $modal.modal("hide");
            vals = parseFloat(vals[0]);
            graphState.editEdge(data.from.id, data.to.id, vals, parseFloat(data.label));
        }, "Edit Edge", "Save", [
            {
                type: "numeric",
                label: "Weight/Capacity",
                initialValue: parseFloat(data.label)
            }
        ]);
    },
    visOptions: {
        interaction: {hover: true},
        manipulation: {
            addNode: function (data, callback) {
                let $popup = help.makeFormModal("Add Node", "Save", [
                    {
                        type: "html",
                        initialValue: "<p>Node ID: " + self.graphState.getProperty("vertices") + "</p>"
                    },
                    {type: "text", label: "Label", initialValue: self.graphState.getProperty("vertices")}
                ]);

                $popup.on("click", ".btn-success", () => {
                    $popup.modal("hide");
                    self.saveData(data, callback, "add", $popup.find("input").first().val());
                }).on("click", ".btn-cancel", () => {
                    $popup.modal("hide");
                    self.cancelEdit(callback);
                }).on("hidden.bs.modal", () => {
                    $popup.remove();
                    self.cancelEdit(callback);
                }).modal("show");
            },
            editNode: function (data, callback) {
                let $popup = help.makeFormModal("Edit Node", "Save", [
                    {
                        type: "html",
                        initialValue: "<p>Node ID: " + data.id + "</p>"
                    },
                    {type: "text", label: "Label", initialValue: data.label}
                ]);

                $popup.on("click", ".btn-success", () => {
                    $popup.modal("hide");
                    self.saveData(data, callback, "editNode", $popup.find("input").first().val());
                }).on("click", ".btn-cancel", () => {
                    $popup.modal("hide");
                    self.cancelEdit(callback);
                }).on("hidden.bs.modal", () => {
                    $popup.remove();
                    self.cancelEdit(callback);
                }).modal("show");
            },
            addEdge: function (data, callback) {
                let apply = function () {
                    if (typeof callback === "function") {
                        callback(null);
                    }
                    graphState.addEdge(data.from, data.to);
                };
                if (data.from === data.to) {
                    if (confirm("Do you want to connect the node to itself?")) {
                        apply();
                    }
                    return;
                }

                apply();
            },
            editEdge: function (data, callback) {
                callback(null);
                self.visOptions.manipulation.deleteEdge({edges: [data.id]});
                self.visOptions.manipulation.addEdge(data);
            },
            deleteEdge: function (data, callback) {
                if (typeof callback === "function") {
                    callback(null);
                }
                data.edges.forEach((v) => {
                    let weight = null;
                    if (typeof window.network.body.data.edges._data[v].label !== "undefined") {
                        weight = parseFloat(window.network.body.data.edges._data[v].label);
                    }

                    graphState.deleteEdge(window.network.body.edges[v].fromId,
                        window.network.body.edges[v].toId, weight);
                });
            },
            deleteNode: function (data, callback) {
                callback(null);
                data.nodes.forEach((v) => {
                    graphState.deleteNode(v);
                });
            },
        },
    },

    cancelEdit: (callback) => {
        if (typeof callback === "function") {
            callback(null);
        }
    },

    saveData: (data, callback, operation, label) => {
        data.label = label;
        callback(null);

        if (operation === "add") {
            graphState.addNode(data);
        }
        else if (operation === "editNode") {
            graphState.editNode(data.id, data.label);
        }
    },

    nodeLabelIDValidator: (v) => {
        if (graphState.nodeLabelToID(v) > -1) {
            return true;
        }
        return "Invalid Label or ID";
    },

    applyColors: () => {
        if (settings.getOption("direction")) {
            return;
        }
        let graphColors = graphState.getProperty("graphColoring", true);
        let chromaticNumber = graphState.getProperty("Chromatic Number", true);

        let colors = randomColor({count: chromaticNumber, luminosity: "light"});
        let G = graphState.graph;
        G.getAllNodes().forEach((v) => {
            G = G.editNode(v.id, {color: colors[graphColors[v.id]]});
        });
        self.setData(graphState.getGraphData(G), false, false);
    },

    setData: (data, recalcProps = false, graphChanged = true, rearrangeGraph = false) => {
        // Store existing positions in the data if we're supposed to keep the layout
        if (rearrangeGraph) {
            data.nodes.forEach((v) => {
                delete v.x;
                delete v.y;
            });
        }

        if (graphChanged) {
            self.saveState();
        }

        if ("directed" in data) {
            settings.changeOption("direction", data.directed);
        }
        if ("weighted" in data) {
            settings.changeOption("weights", data.weighted);
        }
        let directional = settings.getOption("direction");
        let weighted = settings.getOption("weights");

        let g = graphState.dataSetToGraph(data.nodes, data.edges, directional, weighted);
        graphState.graph = g;

        // Set a new random seed so that the layout will be different
        self.randomizeNetworkLayoutSeed(window.network);

        window.network.setData(graphState.getGraphAsDataSet(g));
        self.graphState.graph = self.graphState.setLocations(window.network.getPositions());

        window.network.disableEditMode();
        window.network.enableEditMode();

        if (graphChanged) {
            window.ui.printGraphAlgorithms();
            help.printout("");
            graphState.setUpToDate();
            graphState.makeAndPrintProperties(recalcProps);
        }

        self.saveStateLocalStorage();
    },

    saveState: () => {
        if (graphState.graph === null) {
            return;
        }

        if (graphState.backHistory.length >= graphState.maxHistory) {
            graphState.backHistory.shift();
        }

        graphState.backHistory.push(self.getStateForSaving());
        graphState.forwardHistory = [];
        $(".icon-undo").parent().parent().addClass("active");
    },

    getStateForSaving: () => {
        let state = {};
        Object.keys(graphState).forEach((k) => {
            let v = graphState[k];
            if (typeof v !== "function") {
                if (typeof v !== "object") {
                    state[k] = v;
                }
                else {
                    if (k === "graph" && v !== null) {
                        state[k] = v;
                    }
                    if (!k.toLowerCase().includes("history")) {
                        state[k] = $.extend(true, Array.isArray(v) ? [] : {}, v);
                    }
                }
            }
        });

        return state;
    },

    undo: () => {
        if (graphState.backHistory.length > 0) {
            self.applyState(true);
        }
    },

    redo: () => {
        if (graphState.forwardHistory.length > 0) {
            self.applyState(false);
        }
    },

    applyState: (undo = true, newState = null) => {
        let firstLoad = newState !== null;
        let currentState = self.getStateForSaving();

        if (!firstLoad) {
            if (undo) {
                newState = graphState.backHistory.pop();
            }
            else {
                newState = graphState.forwardHistory.pop();
            }
        }

        newState.graph = new GraphImmut(newState.graph.nodes, newState.graph.edges, newState.graph.directed, newState.graph.weighted);

        settings.changeOption("direction", newState.graph.isDirected());
        settings.changeOption("weights", newState.graph.isWeighted());

        let g = graphState.getGraphAsDataSet(newState.graph);
        graphState.graph = graphState.dataSetToGraph(g.nodes, g.edges, newState.graph.isDirected(), newState.graph.isWeighted());

        window.network.setData(g);
        window.network.disableEditMode();
        window.network.enableEditMode();

        window.ui.printGraphAlgorithms();
        help.printout("");

        Object.keys(newState).forEach((k) => {
            let v = newState[k];
            if (typeof v !== "object") {
                graphState[k] = v;
            }
            else if (!k.toLowerCase().includes("history") && k.toLowerCase() !== "graph") {
                if (k.toLowerCase() === "uptodate") {
                    Object.keys(graphState[k]).forEach((oldKey) => {
                        graphState[k][oldKey].upToDate = v[oldKey].upToDate;
                    });
                }
                else {
                    graphState[k] = $.extend(true, graphState[k], v);
                }
            }
        });

        graphState.makeAndPrintProperties();
        if (undo && !firstLoad) {
            $(".icon-redo").parent().parent().addClass("active");
            if (graphState.backHistory.length === 0) {
                $(".icon-undo").parent().parent().removeClass("active");
            }
            graphState.forwardHistory.push(currentState);
        }
        else if (!undo && !firstLoad) {
            $(".icon-undo").parent().parent().addClass("active");
            if (graphState.forwardHistory.length === 0) {
                $(".icon-redo").parent().parent().removeClass("active");
            }
            graphState.backHistory.push(currentState);
        }

        self.saveStateLocalStorage();
    },

    saveStateLocalStorage: () => {
        if (settings.checkForLocalStorage()) {
            localStorage.setItem("graphPlayground.lastState", JSON.stringify(self.getStateForSaving()));
        }
    },

    shuffleNetworkLayout: () => {
        self.setData({
            nodes: graphState.graph.getAllNodes(),
            edges: graphState.graph.getAllEdges()
        }, false, false, true);
    },

    randomizeNetworkLayoutSeed: (network) => {
        let r = Math.round(Math.random() * 1000000);
        network.layoutEngine.randomSeed = r;
        network.layoutEngine.initialRandomSeed = r;
    },

    addNetworkListeners: (network) => {
        // Enable edit node/edge when double clicking
        network.on("doubleClick", (p) => {
            if (settings.getOption("weights") && "edges" in p && p.edges.length === 1) {
                network.editEdgeMode();
            }
            if ("nodes" in p && p.nodes.length === 1) {
                network.editNode();
            }
        });

        // Save locations of nodes after dragging
        network.on("dragEnd", () => {
            self.graphState.graph = self.graphState.setLocations(network.getPositions());
            self.saveStateLocalStorage(); // Save the new locations as part of the state
        });

        // Delete nodes/edges when hit "Delete"
        let lastNetworkClickEvent = null;
        network.on('click', (event) => {
            lastNetworkClickEvent = event;
        });

        // Delete key to delete node or edge
        $(document).on('keyup', (key) => {
            if (key.key === "Delete" && lastNetworkClickEvent !== null) {
                if ($(self.container).has($(lastNetworkClickEvent.event.target)).length > 0) {
                    if (("edges" in lastNetworkClickEvent && lastNetworkClickEvent.edges.length === 1)
                        || ("nodes" in lastNetworkClickEvent && lastNetworkClickEvent.nodes.length === 1)) {
                        if ($(':focus').parents(".modal").length === 0) {
                            network.deleteSelected();
                        }
                    }
                }
            }
        });

        // Undo/Redo keyboard commands
        $(document).keydown((e) => {
            if ((e.which === 89 && e.ctrlKey) || (e.which === 90 && e.ctrlKey && e.shiftKey)) {
                self.redo();
            }
            else if (e.which === 90 && e.ctrlKey) {
                self.undo();
            }
        });

        // When clicking off of the network, remove the Delete functionality
        $(document).on("click", (e) => {
            if ($(self.container).has(e.target).length === 0) {
                lastNetworkClickEvent = null;
            }
        });
    },

};

export default self;
