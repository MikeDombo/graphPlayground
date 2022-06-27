"use strict";

import "bootstrap";
import { Network } from "vis-network";
import { default as main, MainI } from "./main";
import Settings from "./settings";
import UI from "./UIInteractions";
import { GraphPlain } from "./util/predefinedGraphs";
import * as languages from "./languages";

declare global {
    interface Window {
        main: MainI;
        network: Network;
        settings: typeof Settings;
        ui: typeof UI;
        Worker: Function;
    }
}

window.main = main;
window.settings = Settings;

languages.setLanguage().then(() => {
    window.ui = UI;
    window.ui.registerListeners();

    main.visOptions.locales = languages.current.VisLocale;
    main.visOptions.locale = "";
    window.network = new Network(main.container, {}, main.visOptions);
    Settings.loadSettings();

    main.addNetworkListeners(window.network);

    let loadDefault = true;
    if (Settings.checkForLocalStorage()) {
        const s = localStorage.getItem("graphPlayground.lastState");
        if (s !== null) {
            const jsonGraph: any = JSON.parse(s);
            if ("graph" in jsonGraph && "nodes" in jsonGraph.graph) {
                loadDefault = false;
                main.applyState(false, jsonGraph as { graph: GraphPlain });
            }
        }
    }
    if (loadDefault) {
        (async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            main.setData(predefined.Petersen(), false, true, true);
        })();
    }
});
