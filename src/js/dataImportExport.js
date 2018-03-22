"use strict";

import $ from 'jquery';
import help from './genericHelpers';
import Graph from './Graph';

let self = {
	importByString: (string, format) => {
		if(format.toLowerCase() === "json"){
			try{
				let n = JSON.parse(string);
				if("nodes" in n && "edges" in n){
					window.network.setData({}); // Clear out the existing network in order to import the proper
					// locations
					window.main.setData(n, false, true, false);
				}
				else{
					help.showSimpleModal("Data Import Error", "<p>The provided input does not conform the the" +
						" import specifications.</p>");
				}
			}
			catch(err){
				help.showSimpleModal("JSON Parse Error", "<p>There was an error parsing your input as JSON.</p>"
					+ "<pre>" + err + "</pre>");
			}
		}
		else if(format.toLowerCase() === "dimacs"){
			let lines = string.split(/\r?\n/);
			let graph = null;
			let error = false;
			lines.forEach((l) => {
				let vals = l.split(/\s+/);
				if(vals[0].toLowerCase() === "p"){
					if(vals[1].toLowerCase() !== "edge"){
						help.showSimpleModal("DIMACS Parse Error", "<p>Sorry, but I only know how to parse" +
							" &quot;edge&quot; formatted DIMACS files.</p>");
						error = true;
						return;
					}
					graph = new Graph(parseInt(vals[2]));
				}
				else if(vals[0].toLowerCase() === "e" && graph !== null){
					graph.addEdge(parseInt(vals[1]) - 1, parseInt(vals[2]) - 1);
				}
			});

			if(graph === null && !error){
				help.showSimpleModal("DIMACS Parse Error", "<p>No program line found!</p>");
				error = true;
			}

			if(!error){
				let d = window.main.graphState.getGraphData(graph);
				d.nodes.forEach((v) => {
					v.label = v.id.toString();
				});
				window.main.setData(d, false, true, true);
			}
		}
		else{
			help.showSimpleModal("Unrecognized Input Format", "<p>The format of your input is incorrect.</p>");
		}
	},

	makeImportTextModal: () => {
		help.showFormModal(($modal, values) => {
				$modal.modal("hide");
				self.importByString(values[0], values[1]);
			}, "Import Graph From Text", "Import",
			[{type: "textarea", label: "Input Text", extraAttrs: {style: "height: 20vh; min-height:400px;"}},
				{type: "select", label: "Format", optionValues: ["json", "dimacs"], optionText: ["JSON", "DIMACS"]}
			]);
	},

	makeImportFileModal: () => {
		help.showFormModal(($modal, values) => {
				$modal.modal("hide");

				let files = values[0];
				if(files.length === 1){
					let file = files[0];
					let reader = new FileReader();
					reader.onload = function (event) {
						self.importByString(event.target.result, help.getFileExtension(file.name));
					};

					reader.readAsText(file);
				}
			}, "Import Graph From File", "Import",
			[{
				type: "file", label: "Upload File", validationFunc: (val, $files) => {
					let files = $files.get(0).files;
					if(files.length >= 1){
						return true;
					}
					return "You must choose a file first";
				}
			}]);
	},

	makeExportFileModal: () => {
		help.showFormModal(null, "Export Graph To File", null,
			[{
				type: "button",
				initialValue: "Export to JSON",
				extraAttrs: {
					class: "btn btn-sm btn-primary m-1",
					onclick: "main.dataImpExp.exportToFile(\"json\")"
				},
				clickDismiss: true
			},
				{
					type: "button",
					initialValue: "Export to DIMACS",
					extraAttrs: {
						class: "btn btn-sm btn-primary",
						onclick: "main.dataImpExp.exportToFile(\"dimacs\")"
					},
					clickDismiss: true
				}
			], null, false);
	},

	makeExportTextModal: () => {
		help.showFormModal(null, "Export Graph To Text", null,
			[{
				type: "button",
				initialValue: "Export to JSON",
				extraAttrs: {
					class: "btn btn-sm btn-primary m-1",
					onclick: "main.dataImpExp.exportToText(\"json\")"
				},
				clickDismiss: false
			},
				{
					type: "button",
					initialValue: "Export to DIMACS",
					extraAttrs: {
						class: "btn btn-sm btn-primary",
						onclick: "main.dataImpExp.exportToText(\"dimacs\")"
					},
					clickDismiss: false
				},
				{
					type: "textarea", label: "", initialValue: "", extraAttrs: {
						style: "height: 20vh;" +
						" min-height:400px; white-space:nowrap; margin-top: 1rem;"
					},
					onclick: () => {
						$("#exportedText").select();
						document.execCommand("copy");
					}, id: "exportedText"
				}
			], ($modal) => {
				$modal.modal("hide");
			}, false);
	},

	exportToFile: (format) => {
		if(format.toLowerCase() === "json"){
			self.downloadFile("graph.json", self.getDataAsJSON());
		}
		else if(format.toLowerCase() === "dimacs"){
			self.downloadFile("graph.dimacs", self.getDataAsDIMACS());
		}
	},

	exportToText: (format) => {
		if(format.toLowerCase() === "json"){
			$("#exportedText").text(JSON.stringify(JSON.parse(self.getDataAsJSON()), null, 2));
		}
		else if(format.toLowerCase() === "dimacs"){
			$("#exportedText").text(self.getDataAsDIMACS());
		}
	},

	getDataAsJSON: () => {
		let d = window.main.graphState.getGraphData();
		d = window.main.graphState.getGraphData(window.main.graphState.dataSetToGraph(d.nodes, d.edges, d.directed, d.weighted));
		let nodeKeys = ["id", "label", "color", "x", "y"];
		let edgeKeys = ["from", "to", "weight"];
		d.nodes = help.keepOnlyKeys(d.nodes, nodeKeys);
		d.edges = help.keepOnlyKeys(d.edges, edgeKeys);

		return JSON.stringify(d);
	},

	getDataAsDIMACS: () => {
		// If I add direction, DIMACS cannot be used, it only works for undirected graphs
		let g = window.main.graphState.getGraphData();
		let text = "c This Graph was generated and exported from Michael Dombrowski's Graph Playground --" +
			" https://md100play.github.io/graphPlayground -- https://mikedombrowski.com\n";

		let adj = window.main.graphState.graph.getFullAdjacency();
		adj = adj.filter((v) => {
			return v.length !== 0;
		});

		let nodes = [];
		adj.forEach((v, i) => {
			if(nodes.indexOf(i + 1) === -1){
				nodes.push(i + 1);
			}
			v.forEach((n) => {
				if(nodes.indexOf(n + 1) === -1){
					nodes.push(n + 1);
				}
			});
		});

		let edgeCount = 0;
		let edgeText = "";
		g.edges.forEach((v) => {
			edgeText += "e " + (v.from + 1) + " " + (v.to + 1) + "\n";
			edgeCount++;
		});
		edgeText = edgeText.trim();

		text += "p edge " + nodes.length + " " + edgeCount + "\n";
		return text + edgeText;
	},

	downloadFile: (filename, text) => {
		let blob = new Blob([text], {type: 'text/plain'});
		if(window.navigator.msSaveOrOpenBlob){
			window.navigator.msSaveBlob(blob, filename);
		}
		else{
			let a = window.document.createElement('a');
			a.href = window.URL.createObjectURL(blob);
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blob);
		}
	},
};

export default self;
