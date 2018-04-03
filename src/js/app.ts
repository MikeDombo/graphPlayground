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
    let s: any = localStorage.getItem("graphPlayground.lastState");
    if (s !== null) {
        s = JSON.parse(s);
        if ("graph" in s && "nodes" in s.graph) {
            loadDefault = false;
            main.applyState(false, s);
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
