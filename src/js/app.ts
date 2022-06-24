"use strict";

import "bootstrap";
import { Network } from "vis-network";
import { default as main, MainI } from "./main";
import Settings from "./settings";
import UI from "./UIInteractions";
import { GraphPlain } from "./util/predefinedGraphs";
import * as Sentry from '@sentry/browser';
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
window.network = new Network(main.container, {}, main.visOptions);
window.settings = Settings;

// Initialize Sentry.io error logging
Sentry.init({
    dsn: "https://92aaeee7e2fb4ef4837a2261a029e8ed@sentry.home.mikedombrowski.com/2",
    beforeSend: (event: Sentry.Event) => {
        event.user = {};
        event.user.graph = main.graphState.graph;
        return event;
    }
});

Settings.loadSettings();


languages.setLanguage().then(() => {
    window.ui = UI;
    window.ui.registerListeners();

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
