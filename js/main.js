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
						$popup.find('#node-label').val(graphState.graphProperties.vertices).off("keyup")
						      .on("keyup", (e) =>{
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
						$popup.find('#node-label').val(data.label).off("keyup").on("keyup", (e) =>{
							if(e.key === "Enter"){
								$("#saveButton").click();
							}
						});
						$popup.find('#saveButton')
						      .get(0).onclick = self.saveData.bind(this, data, callback, "editNode");
						$popup.find('#cancelButton').get(0).onclick = self.cancelEdit.bind(this, callback);
						$popup.modal('show').on('shown.bs.modal', () =>{
							$("#node-label").focus();
						});
					},
					addEdge: function (data, callback){
						let apply = function (){
							callback(null);
							graphState.addEdge(data.from, data.to);
						};
						if(data.from === data.to){
							if(confirm("Do you want to connect the node to itself?")){
								apply();
							}
							return;
						}

						apply();
					},
					deleteEdge: function (data, callback){
						callback(null);
						data.edges.forEach((v) =>{
							graphState.deleteEdge(network.body.edges[v].fromId, network.body.edges[v].toId);
						});
					},
					deleteNode: function (data, callback){
						callback(null);
						data.nodes.forEach((v) =>{
							graphState.deleteNode(v);
						});
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
				callback(null);

				if(operation === "add"){
					graphState.addNode(data);
				}
				else if(operation === "editNode"){
					graphState.editNode(data.id, data.label);
				}
			},

			togglePhysics: function (){
				let t = !settings.getOption("nodePhysics");
				settings.changeOption("nodePhysics", t);
				network.setOptions({nodes: {physics: t}});
			},

			makeAndPrintGraphColoring: function (){
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
					graphColors = graphState.getProperty("graphColoring");
					chromaticNumber = graphState.getProperty("Chromatic Number");
				}
				let d = graphState.getGraphData();
				let colors = randomColor({count: chromaticNumber, luminosity: "light"});
				d.nodes.forEach((v) =>{
					v.color = colors[graphColors[v.id]];
				});
				self.setData({nodes: d.nodes, edges: d.edges}, false, false);
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

			setData: function (data, recalcProps = false, graphChanged = true, rearrangeGraph = false){
				let g = null;
				if(rearrangeGraph){
					g = graphState.dataSetToGraph(data.nodes, data.edges);
				}
				else{
					g = graphState.dataSetToGraph(data.nodes, data.edges, network.body.nodes);
				}
				graphState.state.graph = g;
				network.setData(graphState.getGraphAsDataSet(g));
				if(graphChanged){
					help.printout("");
					graphState.setUpToDate();
					graphState.makeAndPrintProperties(recalcProps);
				}
			},

		};
		return self;
	});
