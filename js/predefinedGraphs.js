define(["graphHelpers", "vis"], (gHelp, vis) => {
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

	return {
		graphNames: ["Petersen", "Konigsberg"],
		Petersen: () => ({
			edges: new vis.DataSet(petersenEdges),
			nodes: gHelp.interpolateNodesFromEdges(petersenEdges),
			directed: false,
			weighted: false,
		}),
		Konigsberg: () => ({
			edges: new vis.DataSet(konigsbergEdges),
			nodes: gHelp.interpolateNodesFromEdges(konigsbergEdges),
			directed: false,
			weighted: false,
		}),
	};
});
