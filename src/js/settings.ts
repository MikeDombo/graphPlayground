"use strict";
interface SettingsList {
    nodePhysics: boolean;
    direction: boolean;
    weights: boolean;

    [index: string]: boolean;
}

export default class Settings {
    private static readonly defaults: SettingsList = {
        nodePhysics: true,
        direction: false,
        weights: false
    };
    private static current: any = {};

    public static checkForLocalStorage() {
        try {
            const x = "__storage_test__";
            localStorage.setItem(x, x);
            localStorage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    }

    public static saveSettings() {
        if (Settings.checkForLocalStorage()) {
            localStorage.setItem("graphPlayground.settings", JSON.stringify(Settings.current));
        }
    }

    public static loadSettings() {
        if (Settings.checkForLocalStorage()) {
            const settings = localStorage.getItem("graphPlayground.settings");
            if (settings === null) {
                Settings.current = settings;
            } else {
                Settings.current = JSON.parse(settings);
            }
        }
        if (Settings.current === null) {
            Settings.current = {};
        }
        Settings.setAll();
    }

    public static setAll() {
        window.network.setOptions({ nodes: { physics: Settings.getOption("nodePhysics") as boolean } });
        window.network.setOptions({ edges: { arrows: { to: Settings.getOption("direction") as boolean } } });
        if (Settings.getOption("weights")) {
            window.network.setOptions({
                manipulation: {
                    editEdge: {
                        editWithoutDrag: window.main.visWeightEdgeEdit
                    }
                }
            });
        } else {
            window.network.setOptions({ manipulation: { editEdge: window.main.visOptions.manipulation.editEdge } });
        }
    }

    public static changeOption(option: string, value: string | boolean): void {
        Settings.current[option] = value;
        Settings.saveSettings();
        Settings.setAll();
    }

    public static getOption(option: string): string | boolean {
        if (option in Settings.current) {
            return Settings.current[option];
        }
        return Settings.defaults[option];
    }
}
