"use strict";

let self = {
    defaults: {
        nodePhysics: true,
        direction: false,
        weights: false
    },
    current: {},

    checkForLocalStorage: () => {
        try {
            let x = '__storage_test__';
            localStorage.setItem(x, x);
            localStorage.removeItem(x);
            return true;
        }
        catch (e) {
            return false;
        }
    },

    saveSettings: () => {
        if (self.checkForLocalStorage()) {
            localStorage.setItem("graphPlayground.settings", JSON.stringify(self.current));
        }
    },

    loadSettings: () => {
        if (self.checkForLocalStorage()) {
            self.current = JSON.parse(localStorage.getItem("graphPlayground.settings"));
        }
        if (self.current === null) {
            self.current = {};
        }
        self.setAll();
    },

    setAll: () => {
        window.network.setOptions({nodes: {physics: self.getOption("nodePhysics")}});
        window.network.setOptions({edges: {arrows: {to: self.getOption("direction")}}});
        if (self.getOption("weights")) {
            window.network.setOptions({
                manipulation: {
                    editEdge: {
                        editWithoutDrag: window.main.visWeightEdgeEdit
                    }
                }
            });
        }
        else {
            window.network.setOptions({manipulation: {editEdge: window.main.visOptions.manipulation.editEdge}});
        }
    },

    changeOption: (option, value) => {
        self.current[option] = value;
        self.saveSettings();
        self.setAll();
    },

    getOption: (option) => {
        if (option in self.current) {
            return self.current[option];
        }
        return self.defaults[option];
    },

    resetToDefault: () => {
        self.current = {};
        self.saveSettings();
        self.setAll();

        // Reset graph to just a plain graph. Not sure if this should actually happen or not.
        let G = window.main.graphState.graph.asChangedDirectedWeighted(self.defaults.direction, self.defaults.weights);
        window.main.setData(window.main.graphState.getGraphData(G));
    }
};

export default self;
