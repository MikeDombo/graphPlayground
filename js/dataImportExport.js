define(["genericHelpers", "jquery"], (help, $) =>{
	let self = {
		importByString: function (string, format){
			if(format.toLowerCase() === "json"){
				try{
					let n = JSON.parse(string);
					if("nodes" in n && "edges" in n){
						main.setData({nodes: new vis.DataSet(n.nodes), edges: new vis.DataSet(n.edges)});
					}
					else{
						help.showErrorModal("Data Import Error", "<p>The provided input does not conform the the" +
							" import specifications.</p>");
					}
				}
				catch(err){
					help.showErrorModal("JSON Parse Error", "<p>There was an error parsing your input as JSON.</p>"
						+ "<pre>" + err + "</pre>");
				}
			}
			else{
				help.showErrorModal("Unrecognized Input Format", "<p>The format of your input is incorrect.</p>");
			}

			let lines = string.split(/\r?\n/);
		},

		makeImportTextModal: function(){
			let $textModal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$textModal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text("Import Graph From Text"))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append($("<div>", {class: "modal-body"})
							.append($("<textarea>", {class: "form-control",
								style: "height: 20vh; min-height:400px;"}))
							.append($("<select>", {class: "form-control mt-1"})
								.append($("<option>", {value: "json"}).text("JSON"))
								.append($("<option>", {value: "dimacs"}).text("DIMACS"))
							)
						)
						.append($("<div>", {class: "modal-footer"})
							.append($("<button>", {class: "btn btn-success btn-import", type: "button"}).text("Import"))
							.append($("<button>", {class: "btn btn-danger btn-cancel", type: "button"}).text("Cancel"))
						)
					)
				);

			$textModal.on("click", ".btn-cancel", () =>{
				$textModal.modal("hide");
			});
			$textModal.on("click", ".btn-import", () =>{
				let text = $textModal.find("textarea").first().val();
				let format = $textModal.find("select").find(":selected").val();
				$textModal.modal("hide");
				self.importByString(text, format);
			});
			$textModal.on("hidden.bs.modal", () => {$textModal.remove();});
			$textModal.modal('show');
		},

		readUploadFile: function (file){
			let reader = new FileReader();
			reader.onload = function (event){
				self.importByString(event.target.result, help.getFileExtension(file.name));
			};

			reader.readAsText(file);
		},

		makeImportFileModal: function (){
			let $fileModal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$fileModal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text("Import Graph From File"))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append($("<div>", {class: "modal-body"})
							.append($("<input>", {type: "file"}))
						)
						.append($("<div>", {class: "modal-footer"})
							.append($("<button>", {class: "btn btn-success btn-import", type: "button"}).text("Import"))
							.append($("<button>", {class: "btn btn-danger btn-cancel", type: "button"}).text("Cancel"))
						)
					)
				);

			$fileModal.on("click", ".btn-cancel", () =>{
				$fileModal.modal("hide");
			});
			$fileModal.on("click", ".btn-import", () =>{
				let files = $fileModal.find("input").get(0).files;
				if(files.length < 1){
					alert("You must choose a file first");
					return;
				}
				$fileModal.modal("hide");
				if(files.length === 1){
					self.readUploadFile(files[0]);
				}
			});
			$fileModal.on("hidden.bs.modal", () => {$fileModal.remove();});
			$fileModal.modal('show');
		},

		makeExportFileModal: function (){
			let $fileModal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$fileModal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text("Export Graph To File"))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append($("<div>", {class: "modal-body"})
							.append($("<button>", {class:"btn btn-sm btn-primary btn-export m-1",
								onclick: "main.dataImpExp.exportToFile(\"json\")"})
								.text("Export to JSON")
							)
							.append($("<button>", {class:"btn btn-sm btn-primary btn-export m-1",
								onclick: "main.dataImpExp.exportToFile(\"dimacs\")"})
								.text("Export to DIMACS")
							)
						)
					)
				);

			$fileModal.on("click", ".btn-cancel", () =>{
				$fileModal.modal("hide");
			});
			$fileModal.on("hidden.bs.modal", () => {$fileModal.remove();});
			$fileModal.modal('show');
		},

		makeExportTextModal: function(){
			let $textModal = ($("<div>", {class: "modal fade", tabindex: "-1", role: "dialog", "aria-hidden": "true"}));
			$textModal
				.append($("<div>", {class: "modal-dialog"})
					.append($("<div>", {class: "modal-content"})
						.append($("<div>", {class: "modal-header"})
							.append($("<h5>", {class: "modal-title"}).text("Export Graph To Text"))
							.append($("<button>", {class: "close", "data-dismiss": "modal", "aria-label": "close"})
								.append($("<span>", {"aria-hidden": "true"}).html("&times;"))
							)
						)
						.append($("<div>", {class: "modal-body"})
							.append($("<button>", {class:"btn btn-primary btn-export m-1",
								onclick: "main.dataImpExp.exportToText(\"json\")"})
								.text("Export to JSON")
							)
							.append($("<button>", {class:"btn btn-primary btn-export m-1",
								onclick: "main.dataImpExp.exportToText(\"dimacs\")"})
								.text("Export to DIMACS")
							)
							.append($("<textarea>", {id: "exportedText", class: "form-control mt-2",
								style:"height: 20vh; min-height:400px; white-space:nowrap;"}))
						)
					)
				);

			$textModal.on("click", ".btn-cancel", () =>{
				$fileModal.modal("hide");
			});
			$textModal.on("click", "#exportedText", () =>{
				$("#exportedText").select();
				document.execCommand("copy");
			});
			$textModal.on("hidden.bs.modal", () => {$textModal.remove();});
			$textModal.modal('show');
		},

		exportToFile: function(format){
			if(format.toLowerCase() === "json"){
				self.downloadFile("graph.json", self.getDataAsJSON());
			}
			else if(format.toLowerCase() === "dimacs"){
				self.downloadFile("graph.dimacs", self.getDataAsDIMACS());
			}
		},

		exportToText: function(format){
			if(format.toLowerCase() === "json"){
				$("#exportedText").text(JSON.stringify(JSON.parse(self.getDataAsJSON()), null, 2));
			}
			else if(format.toLowerCase() === "dimacs"){
				$("#exportedText").text(self.getDataAsDIMACS());
			}
		},

		getDataAsJSON: function (){
			let g = {nodes: help.datasetToArrayMap(main.getNodes()), edges: help.datasetToArrayMap(main.getEdges())};
			let nodeKeys = ["id", "label"];
			let edgeKeys = ["from", "to", "weight"];
			g.nodes = help.keepOnlyKeys(g.nodes, nodeKeys);
			g.edges = help.keepOnlyKeys(g.edges, edgeKeys);

			return JSON.stringify(g);
		},

		getDataAsDIMACS: function (){
			// If I add direction, DIMACS cannot be used, it only works for undirected graphs
			let g = {nodes: help.datasetToArrayMap(main.getNodes()), edges: help.datasetToArrayMap(main.getEdges())};
			let text = "c This Graph was generated and exported from Michael Dombrowski's Graph Playground --" +
				" https://md100play.github.io/graphPlayground -- https://mikedombrowski.com\n";

			let adj = main.graphHelper.makeSingleAdjacencyMatrix(g.nodes, g.edges).matrix;
			adj = adj.filter((v) =>{
				return v.length !== 0;
			});

			let nodes = [];
			adj.forEach((v, i) =>{
				if(nodes.indexOf(i + 1) === -1){
					nodes.push(i + 1);
				}
				v.forEach((n) =>{
					if(nodes.indexOf(n + 1) === -1){
						nodes.push(n + 1);
					}
				});
			});

			let edgeCount = 0;
			let edgeText = "";
			adj.forEach((v, i) =>{
				v.forEach((n) =>{
					edgeText += "e " + (i + 1) + " " + (n + 1) + "\n";
					edgeCount++;
				});
			});
			edgeText = edgeText.trim();

			text += "p edge " + nodes.length + " " + edgeCount + "\n";
			return text + edgeText;
		},

		downloadFile: function (filename, text){
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
	return self;
});
