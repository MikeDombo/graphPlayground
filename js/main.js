define(["jquery", "graphAlgorithms", "graphHelpers", "genericHelpers", "settings", "lib/randomColor", "graphState", "dataImportExport"],
	($, gAlgo, gHelp, help, settings, randomColor, graphState, dataImpExp) =>{
		let self = {
			dataImpExp: dataImpExp,
			graphState: graphState,
			graphHelper: gHelp,
			container: document.getElementById('network'),
			visOptions: {
				interaction: {hover: true},
				manipulation: {
					addNode: function (data, callback){
						let $popup = $('#network-popUp');
						$popup.find('#operation').html("Add Node");
						$popup.find('#node-label').val("").on("keyup", (e) =>{
							if(e.key === "Enter"){
								$("#saveButton").click();
							}
						});
						$popup.find('#saveButton').get(0).onclick = self.saveData.bind(this, data, callback, "add");
						$popup.find('#cancelButton').get(0).onclick = self.cancelEdit.bind(this);
						$popup.modal('show').on('shown.bs.modal', () =>{
							$("#node-label").focus();
						});
					},
					editNode: function (data, callback){
						let $popup = $('#network-popUp');
						$popup.find('#operation').html("Edit Node");
						$popup.find('#node-label').val(data.label).on("keyup", (e) =>{
							if(e.key === "Enter"){
								$("#saveButton").click();
							}
						});
						$popup.find('#saveButton').get(0).onclick = self.saveData.bind(this, data, callback);
						$popup.find('#cancelButton').get(0).onclick = self.cancelEdit.bind(this, callback);
						$popup.modal('show').on('shown.bs.modal', () =>{
							$("#node-label").focus();
						});
					},
					addEdge: function (data, callback){
						let apply = function(){
							callback(data);
							graphState.setUpToDate();
							graphState.makeAndPrintProperties(false);
						};
						if(data.from === data.to){
							if(confirm("Do you want to connect the node to itself?")){
								apply();
							}
							return;
						}

						let repeatedEdge = false;
						self.getEdges().forEach((v) =>{
							if((v.from === data.from && v.to === data.to) || (v.to === data.from && v.from === data.to)){
								repeatedEdge = true;
							}
						});

						if(repeatedEdge){
							if(confirm("Do you want to doubly connect this node?")){
								apply();
							}
							return;
						}
						apply();
					},
					deleteEdge: function (data, callback){
						callback(data);
						graphState.setUpToDate();
						graphState.makeAndPrintProperties(false);
					},
					deleteNode: function(data, callback){
						callback(data);
						graphState.setUpToDate();
						graphState.makeAndPrintProperties(false);
					},
				},
			},

			cancelEdit: function (callback){
				$('#network-popUp').modal('hide');
				if(typeof callback === "function"){
					callback(null);
				}
			},

			saveData: function (data, callback, operation){
				$('#network-popUp').modal('hide');
				data.label = document.getElementById('node-label').value;
				callback(data);
				if(operation === "add"){
					graphState.setUpToDate();
					graphState.makeAndPrintProperties(false);
				}
			},

			getNodes: function (n = network){
				return n.body.data.nodes;
			},

			getEdges: function (n = network){
				return n.body.data.edges;
			},

			togglePhysics: function (){
				let t = !settings.getOption("nodePhysics");
				settings.changeOption("nodePhysics", t);
				network.setOptions({nodes: {physics: t}});
			},

			makeAndPrintGraphColoring: function (){
				if(!confirm("Coloring the graph will normalize it to be undirected and not be a multigraph!")){
					return;
				}
				let a = gAlgo.colorNetwork();

				graphState.graphProperties["Chromatic Number"] = a.chromaticNumber;
				graphState.setUpToDate(true, ["Chromatic Number"]);
				graphState.makeAndPrintProperties(false);
				graphState.setUpToDate(true, ["graphColoring"]);
				graphState.state.graphColoring = a.colors;

				let colors = help.flatten(a.colors);
				let p = "Number of Vertices: " + colors.length;
				p += "\nChromatic Number: " + a.chromaticNumber;
				p += "\n\n";

				// TODO: print vertex label - if any
				colors.forEach((v, i) =>{
					p += "Vertex " + i + " gets color " + v + "\n";
				});

				p += "\n" + JSON.stringify(help.rotate(a.colors), null, 4) + "\n\n";

				p = "<h3>Graph Coloring Using Welsh-Powell Algorithm</h3><hr>" + help.htmlEncode(p);
				p += "<br/><button class='btn btn-primary' onclick='main.applyColors()'>Apply Colors To Graph</button>";

				help.printout(p);
			},

			applyColors: function (){
				let graphColors = graphState.getProperty("graphColoring");
				let chromaticNumber = graphState.getProperty("Chromatic Number");
				if(graphColors === null || chromaticNumber === null){
					self.makeAndPrintGraphColoring();
				}
				let nodes = self.getNodes();
				let colors = randomColor({count: chromaticNumber, luminosity: "light"});
				nodes.forEach((v) =>{
					v.color = colors[graphColors[v.id]];
					nodes.update(v);
				});
				self.setData({nodes: nodes, edges: self.getEdges()});
			},

			singleyConnectGraph: function (nodes, edges, fullNodeInfo){
				let m = gHelp.makeSingleAdjacencyMatrix(nodes, edges);
				let adjacency = m.matrix;
				let nodeMap = help.rotate(m.map);
				nodes = new vis.DataSet();
				edges = new vis.DataSet();

				adjacency.forEach((v, i) =>{
					let n = fullNodeInfo[nodeMap[i]];
					nodes.add({id: i, label: n.options.label, x: n.x, y: n.y});
					v.forEach((n2) =>{
						edges.add({from: i, to: n2});
					});
				});

				return {nodes: nodes, edges: edges};
			},

			setData: function (data, recalcProps = false, checkEquality = true){
				if(!checkEquality || !gAlgo.graphEqual(self.getEdges(), data.edges)){
					network.setData(data);
					help.printout("");
					graphState.setUpToDate();
					graphState.makeAndPrintProperties(recalcProps);
				}
			},

		};
		return self;
	});
