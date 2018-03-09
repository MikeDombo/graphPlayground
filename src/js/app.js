import 'bootstrap';
import vis from 'vis';
import m from './main';
import predefined from './predefinedGraphs';
import settings from './settings';
import Graph from './Graph';

window.main = m;
window.predefined = predefined;
window.settings = settings;
window.network = new vis.Network(m.container, {}, m.visOptions);

main.addNetworkListeners(network);

settings.loadSettings();

let loadDefault = true;
if(settings.checkForLocalStorage()){
	let s = localStorage.getItem("graphPlayground.lastState");
	if(s !== null){
		s = JSON.parse(s);
		if("nodes" in s.graph){
			s.graph = new Graph(s.graph.nodes, s.graph.edges, s.graph.directed, s.graph.weighted);
			loadDefault = false;
			main.applyState(false, s);
		}
	}
}
if(loadDefault){
	main.setData(predefined.Petersen(), false, true, true);
}

// Register service worker
if('serviceWorker' in navigator){
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('pwaServiceWorkerPack.js').then(function (registration) {
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}).catch(function (err) {
			console.log('ServiceWorker registration failed: ', err);
		});
	});
}
