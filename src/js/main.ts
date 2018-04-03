"use strict";

import * as $ from 'jquery';
import help from './genericHelpers';
import randomColor from 'randomcolor';
import graphState from './graphState';
import GraphImmut from "./GraphImmut/GraphImmut";

export interface mainI {
    graphState;
    container: HTMLElement;
    visWeightEdgeEdit: (data, callback) => void;
    visOptions: {
        interaction: { hover: boolean };
        manipulation: {
            addNode: (data, callback) => void;
            editNode: (data, callback) => void;
            addEdge: (data, callback?: any) => undefined | void;
            editEdge: (data, callback) => void;
            deleteEdge: (data, callback?: any) => void;
            deleteNode: (data, callback) => void
        }
    };
    cancelEdit: (callback) => void;
    saveData: (data, callback, operation, label) => void;
    nodeLabelIDValidator: (v) => (boolean | string);
    applyColors: () => undefined | void;
    setData: (data, recalcProps?: boolean, graphChanged?: boolean, rearrangeGraph?: boolean) => void;
    saveState: () => undefined|void;
    getStateForSaving: () => {};
    undo: () => void;
    redo: () => void;
    applyState: (undo?: boolean, newState?: any) => void;
    saveStateLocalStorage: () => void;
    shuffleNetworkLayout: () => void;
    randomizeNetworkLayoutSeed: (network) => void;
    addNetworkListeners: (network) => void
}

let self: mainI = {
    graphState: graphState,
    container: document.getElementById('network'),
    // Function used to overwrite the edge edit functionality when weights are active
    visWeightEdgeEdit: (data, callback) => {
        help.showFormModal(($modal, vals) => {
            callback(null);
            $modal.modal("hide");
            vals = parseFloat(vals[0]);
            self.graphState.editEdge(data.from.id, data.to.id, vals, parseFloat(data.label));
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
            addNode: function (data, callback): void {
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
            editNode: function (data, callback): void {
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
            addEdge: function (data, callback?: any): undefined | void {
                let apply = function () {
                    if (typeof callback === "function") {
                        callback(null);
                    }
                    self.graphState.addEdge(data.from, data.to);
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
            deleteEdge: function (data, callback?: any) {
                if (typeof callback === "function") {
                    callback(null);
                }
                data.edges.forEach((v) => {
                    let weight = null;
                    if (typeof (<any> window.network).body.data.edges._data[v].label !== "undefined") {
                        weight = parseFloat((<any> window.network).body.data.edges._data[v].label);
                    }

                    self.graphState.deleteEdge((<any> window.network).body.edges[v].fromId,
                        (<any> window.network).body.edges[v].toId, weight);
                });
            },
            deleteNode: function (data, callback) {
                callback(null);
                data.nodes.forEach((v) => {
                    self.graphState.deleteNode(v);
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
            self.graphState.addNode(data);
        }
        else if (operation === "editNode") {
            self.graphState.editNode(data.id, data.label);
        }
    },

    nodeLabelIDValidator: (v) => {
        if (self.graphState.nodeLabelToID(v) > -1) {
            return true;
        }
        return "Invalid Label or ID";
    },

    applyColors: (): void | undefined => {
        if (window.settings.getOption("direction")) {
            return;
        }
        let graphColors = self.graphState.getProperty("graphColoring", true);
        let chromaticNumber = self.graphState.getProperty("Chromatic Number", true);

        let colors = randomColor({count: chromaticNumber, luminosity: "light"});
        let G = self.graphState.graph;
        G.getAllNodes().forEach((v) => {
            G = G.editNode(v.id, {color: colors[graphColors[v.id]]});
        });
        self.setData(self.graphState.getGraphData(G), false, false);
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
            window.settings.changeOption("direction", data.directed);
        }
        if ("weighted" in data) {
            window.settings.changeOption("weights", data.weighted);
        }
        let directional = window.settings.getOption("direction");
        let weighted = window.settings.getOption("weights");

        let g = new GraphImmut(data.nodes, data.edges, directional, weighted);
        self.graphState.graph = g;

        // Set a new random seed so that the layout will be different
        self.randomizeNetworkLayoutSeed(window.network);
        window.network.setData(self.graphState.getGraphAsDataSet(g));
        self.graphState.graph = self.graphState.setLocations(window.network.getPositions());

        window.network.disableEditMode();
        window.network.enableEditMode();

        if (graphChanged) {
            window.ui.printGraphAlgorithms();
            help.printout("");
            self.graphState.setUpToDate();
            self.graphState.makeAndPrintProperties(recalcProps);
        }

        self.saveStateLocalStorage();
    },

    saveState: ():void|undefined => {
        if (self.graphState.graph === null) {
            return;
        }

        if (self.graphState.backHistory.length >= self.graphState.maxHistory) {
            self.graphState.backHistory.shift();
        }

        self.graphState.backHistory.push(self.getStateForSaving());
        self.graphState.forwardHistory = [];
        $(".icon-undo").parent().parent().addClass("active");
    },

    getStateForSaving: () => {
        let state = {};
        Object.keys(self.graphState).forEach((k) => {
            let v = self.graphState[k];
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
        if (self.graphState.backHistory.length > 0) {
            self.applyState(true);
        }
    },

    redo: () => {
        if (self.graphState.forwardHistory.length > 0) {
            self.applyState(false);
        }
    },

    applyState: (undo = true, newState = null) => {
        let firstLoad = newState !== null;
        let currentState = self.getStateForSaving();

        if (!firstLoad) {
            if (undo) {
                newState = self.graphState.backHistory.pop();
            }
            else {
                newState = self.graphState.forwardHistory.pop();
            }
        }

        newState.graph = new GraphImmut(newState.graph.nodes, newState.graph.edges, newState.graph.directed, newState.graph.weighted);

        window.settings.changeOption("direction", newState.graph.isDirected());
        window.settings.changeOption("weights", newState.graph.isWeighted());

        self.graphState.graph = newState.graph;

        window.network.setData(self.graphState.getGraphAsDataSet(self.graphState.graph));
        window.network.disableEditMode();
        window.network.enableEditMode();

        window.ui.printGraphAlgorithms();
        help.printout("");

        Object.keys(newState).forEach((k) => {
            let v = newState[k];
            if (typeof v !== "object") {
                self.graphState[k] = v;
            }
            else if (!k.toLowerCase().includes("history") && k.toLowerCase() !== "graph") {
                if (k.toLowerCase() === "uptodate") {
                    Object.keys(self.graphState[k]).forEach((oldKey) => {
                        self.graphState[k][oldKey].upToDate = v[oldKey].upToDate;
                    });
                }
                else {
                    self.graphState[k] = $.extend(true, self.graphState[k], v);
                }
            }
        });

        self.graphState.makeAndPrintProperties();
        if (undo && !firstLoad) {
            $(".icon-redo").parent().parent().addClass("active");
            if (self.graphState.backHistory.length === 0) {
                $(".icon-undo").parent().parent().removeClass("active");
            }
            self.graphState.forwardHistory.push(currentState);
        }
        else if (!undo && !firstLoad) {
            $(".icon-undo").parent().parent().addClass("active");
            if (self.graphState.forwardHistory.length === 0) {
                $(".icon-redo").parent().parent().removeClass("active");
            }
            self.graphState.backHistory.push(currentState);
        }

        self.saveStateLocalStorage();
    },

    saveStateLocalStorage: () => {
        if (window.settings.checkForLocalStorage()) {
            localStorage.setItem("graphPlayground.lastState", JSON.stringify(self.getStateForSaving()));
        }
    },

    shuffleNetworkLayout: () => {
        self.setData({
            nodes: self.graphState.graph.getAllNodes(),
            edges: self.graphState.graph.getAllEdges()
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
            if (window.settings.getOption("weights") && "edges" in p && p.edges.length === 1) {
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
                if ($(self.container).has(lastNetworkClickEvent.event.target).length > 0) {
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
