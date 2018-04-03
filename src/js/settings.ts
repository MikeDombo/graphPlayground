"use strict";
import GraphState from './graphState';

interface SettingsList {
    nodePhysics: boolean;
    direction: boolean;
    weights: boolean;

    [index: string]: boolean
}

export interface SettingsI {
    defaults: SettingsList;
    current: any;
    checkForLocalStorage: () => (boolean);
    saveSettings: () => void;
    loadSettings: () => void;
    setAll: () => void;
    changeOption: (option: string, value: string | boolean) => void;
    getOption: (option: string) => string | boolean;
    resetToDefault: () => void
}

const self: SettingsI = {
    defaults: {
        nodePhysics: true,
        direction: false,
        weights: false
    } as SettingsList,

    current: {} as any,

    checkForLocalStorage: () => {
        try {
            const x = '__storage_test__';
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
        window.network.setOptions({nodes: {physics: self.getOption("nodePhysics") as boolean}});
        window.network.setOptions({edges: {arrows: {to: self.getOption("direction") as boolean}}});
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

    changeOption: (option: string, value: string | boolean): void => {
        self.current[option] = value;
        self.saveSettings();
        self.setAll();
    },

    getOption: (option: string): string | boolean => {
        if (option in self.current) {
            return self.current[option];
        }
        return self.defaults[option];
    },

    resetToDefault: (): void => {
        self.current = {};
        self.saveSettings();
        self.setAll();

        // Reset graph to just a plain graph. Not sure if this should actually happen or not.
        const G = GraphState.graph.asChangedDirectedWeighted(self.defaults.direction, self.defaults.weights);
        window.main.setData(GraphState.getGraphData(G));
    }
};

export default self;
