export default {
    // Algorithms
    GraphColoring: "Graph Coloring",
    ConnectedComponents: "Connected Components",
    StronglyConnectedComponents: "Strongly Connected Components",
    BFS: "Breadth-First Shortest Path",
    Dijkstra: "Dijkstra Shortest Path",
    BellmanFord: "Bellman-Ford Shortest Path",
    FordFulkerson: "Ford-Fulkerson",
    KruskalMST: "Kruskal Minimum Spanning Tree",
    Cyclic: "Cyclic",
    TopoSort: "Topological Sort",
    Eulerian: "Eulerian",

    ShortestPath: "Shortest Path",
    DijkstraError: "Dijkstra Error",
    DijkstraErrorHTML: "<p>The Dijkstra algorithm only works on graphs" +
        " with totally non-negative edge weights. Please fix the graph so that there are no" +
        " negative edge weights.</p><p>Alternatively, try the Bellman-Ford algorithm which solves" +
        " exactly this problem.</p>",
    BellmanFordError: "Bellman-Ford Error",
    BellmanFordErrorHTML: "<p>The Bellman-Ford algorithm only works on graphs" +
        " with no negative edge-weight cycles. Please remove the negative cycle and try again.</p>",

    // UI
    Help: "Help",
    Options: "Options",
    Save: "Save",
    IssuesHTML: "<h4>For support see the " +
        "<a href='https://github.com/MikeDombo/graphPlayground' target='_blank'>GitHub repository</a>" +
        " for guides</h4> <h4>See <a href='https://github.com/MikeDombo/graphPlayground/issues' target='_blank'>" +
        "GitHub issues</a> to submit bugs or feature requests.</h4>",

    GraphPhysics: "Graph Physics",
    DiGraph: "Directed Graph",
    WeightedGraph: "Weighted Graph",
    CustomNodeColors: "Customize Node Colors",
};