"use strict";

import 'bootstrap';
import * as Raven from 'raven-js';
import {Network} from 'vis/index-network';
import {default as main, MainI} from './main';
import {default as settings, SettingsI} from './settings';
import {default as UI, UIInteractionsI} from './UIInteractions';

declare global {
    interface Window {
        main: MainI;
        network: Network;
        settings: SettingsI;
        ui: UIInteractionsI,
        Raven: Raven.RavenStatic
    }
}

window.main = main;
window.network = new Network(main.container, {}, main.visOptions);
window.settings = settings;
window.ui = UI;

// Initialize Sentry.io error logging
Raven.config('https://92aaeee7e2fb4ef4837a2261a029e8ed@sentry.home.mikedombrowski.com/2').install();
window.Raven = Raven;

main.addNetworkListeners(window.network);

settings.loadSettings();

let loadDefault = true;
if (settings.checkForLocalStorage()) {
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
        const predefined = (await import("./predefinedGraphs")).default;
        main.setData(predefined.Petersen(), false, true, true);
    })();
}

window.ui.registerListeners();
