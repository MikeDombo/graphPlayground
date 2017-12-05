define(["graphHelpers", "genericHelpers"], (gHelp, help) => {
	let petersenEdges = [
		{from: 1, to: 2},
		{from: 2, to: 3},
		{from: 3, to: 4},
		{from: 4, to: 5},
		{from: 5, to: 1},

		{from: 6, to: 8},
		{from: 7, to: 9},
		{from: 7, to: 10},
		{from: 8, to: 10},
		{from: 9, to: 6},

		{from: 1, to: 6},
		{from: 2, to: 7},
		{from: 3, to: 8},
		{from: 4, to: 9},
		{from: 5, to: 10}
	];

	let konigsbergEdges = [
		{from: 1, to: 2},
		{from: 2, to: 3},
		{from: 2, to: 4},
		{from: 3, to: 4},
		{from: 3, to: 4},
		{from: 4, to: 1},
		{from: 4, to: 1},
	];

	let completeGraph = (V) => {
		let edges = [];
		let nodes = [];

		for(let i = 0; i < V; i++){
			nodes.push({id: i, label: i.toString()});
			for(let j = i + 1; j < V; j++){
				edges.push({from: i, to: j});
			}
		}

		return {nodes: nodes, edges: edges, directed: false, weighted: false};
	};

	let hypercubeGraph = (D) => {
		let edges = [];
		let nodes = [];

		let numNodes = Math.pow(2, D);

		let pad = (str, max) => {
			return str.length < max ? pad("0" + str, max) : str;
		};

		let generateDifferByOne = (input, numBits) => {
			let inputBits = pad((input).toString(2), numBits).split("").reverse();
			let allDiffer = [];

			// 1 bit difference from input, increasing order, none less than input
			for(let b = 0; b < numBits; b++){
				if(inputBits[b] === "0"){
					let newNum = inputBits.slice();
					newNum[b] = "1";
					allDiffer.push(parseInt(newNum.reverse().join(""), 2));
				}
			}

			return allDiffer;
		};

		for(let i = 0; i < numNodes; i++){
			nodes.push({id: i, label: pad(i.toString(2), D)});
			generateDifferByOne(i, D).forEach((j) => {
				edges.push({from: i, to: j});
			});
		}

		return {nodes: nodes, edges: edges, directed: false, weighted: false};
	};

	let newCustomGraph = (V, directed = false, weighted = false) => {
		let nodes = [];
		for(let i = 0; i < V; i++){
			nodes.push({id: i, label: i.toString()});
		}

		return {nodes: nodes, edges: [], directed: directed, weighted: weighted};
	};

	return {
		graphNames: ["Petersen", "Konigsberg", "Complete", "Hypercube"],
		Petersen: () => ({
			edges: petersenEdges,
			nodes: gHelp.interpolateNodesFromEdges(petersenEdges),
			directed: false,
			weighted: false,
		}),
		Konigsberg: () => ({
			edges: konigsbergEdges,
			nodes: gHelp.interpolateNodesFromEdges(konigsbergEdges),
			directed: false,
			weighted: false,
		}),
		Complete: () => {
			help.showFormModal(($modal, vals) => {
					$modal.modal("hide");
					main.setData(completeGraph(vals[0]), false, true, true);
				},
				"Configurable Complete Graph", "Go",
				[{
					type: "numeric", initialValue: 5, label: "Number of Vertices", validationFunc: (v) => {
						return v >= 0 || "Number of vertices must be non-negative";
					}
				}]);
		},
		Hypercube: () => {
			help.showFormModal(($modal, vals) => {
					$modal.modal("hide");
					main.setData(hypercubeGraph(vals[0]), false, true, true);
				},
				"Configurable Hypercube Graph", "Go",
				[{
					type: "numeric", initialValue: 3, label: "Number of Dimensions", validationFunc: (v) => {
						return v >= 0 || "Number of dimensions must be non-negative";
					}
				}]);
		},
		Custom: () => {
			help.showFormModal(($modal, vals) => {
					$modal.modal("hide");
					main.setData(newCustomGraph(vals[0], vals[1], vals[2]), false, true, true);
				},
				"Configurable Graph", "Go",
				[
					{
						type: "numeric", initialValue: 0, label: "Number of Vertices", validationFunc: (v) => {
							return v >= 0 || "Number of vertices must be non-negative";
						}
					},
					{type: "checkbox", initialValue: false, label: "Directed"},
					{type: "checkbox", initialValue: false, label: "Weighted"},
				]);
		},
	};
});
