"use strict";

import 'bootstrap';
import Raven from 'raven-js';
import {Network} from 'vis/index-network';
import main from './main';
import predefined from './predefinedGraphs';
import settings from './settings';
import UI from './UIInteractions';

window.main = main;
window.predefined = predefined;
window.network = new Network(main.container, {}, main.visOptions);
window.settings = settings;
window.ui = UI;

// Initialize Sentry.io error logging
Raven.config('https://355bd6aa42eb41b99a31fffc8cced0ba@sentry.io/487861').install();
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
    main.setData(predefined.Petersen(), false, true, true);
}

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('pwaPacked.js').then(function (registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(function (err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

window.ui.registerListeners();
