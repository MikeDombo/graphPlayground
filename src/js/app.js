"use strict";

import 'bootstrap';
import Raven from 'raven-js';
import {Network} from 'vis/index-network';
import main from './main';
import settings from './settings';
import UI from './UIInteractions';

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
    let s = localStorage.getItem("graphPlayground.lastState");
    if (s !== null) {
        s = JSON.parse(s);
        if ("nodes" in s.graph) {
            loadDefault = false;
            main.applyState(false, s);
        }
    }
}
if (loadDefault) {
    (async () => {
        let predefined = await import("./predefinedGraphs");
        main.setData(predefined.default.Petersen(), false, true, true);
    })();
}

window.ui.registerListeners();
