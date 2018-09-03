"use strict";

import 'bootstrap';
import * as Raven from 'raven-js';
import {Network} from 'vis/index-network';
import {default as main, MainI} from './main';
import Settings from './settings';
import UI from './UIInteractions';
import {GraphPlain} from "./util/predefinedGraphs";

declare global {
    interface Window {
        main: MainI;
        network: Network;
        settings: typeof Settings;
        ui: typeof UI,
        Raven: Raven.RavenStatic,
        Worker: Function
    }
}

window.main = main;
window.network = new Network(main.container, {}, main.visOptions);
window.settings = Settings;
window.ui = UI;

// Initialize Sentry.io error logging
Raven.config('https://92aaeee7e2fb4ef4837a2261a029e8ed@sentry.home.mikedombrowski.com/2').install();
window.Raven = Raven;

main.addNetworkListeners(window.network);

Settings.loadSettings();

let loadDefault = true;
if (Settings.checkForLocalStorage()) {
    const s: string = localStorage.getItem("graphPlayground.lastState");
    if (s !== null) {
        const jsonGraph: any = JSON.parse(s);
        if ("graph" in jsonGraph && "nodes" in jsonGraph.graph) {
            loadDefault = false;
            main.applyState(false, jsonGraph as {graph: GraphPlain});
        }
    }
}
if (loadDefault) {
    (async () => {
        const predefined = (await import("./util/predefinedGraphs")).default;
        main.setData(predefined.Petersen(), false, true, true);
    })();
}

window.ui.registerListeners();
