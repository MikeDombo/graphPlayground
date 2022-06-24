export default {
    // Algorithms
    GraphColoring: "Graph Coloring",
    ConnectedComponents: "Connected Components",
    StronglyConnectedComponents: "Strongly Connected Components",
    BFS: "Breadth-First Shortest Path",
    Dijkstra: "Dijkstra Shortest Path",
    BellmanFord: "Bellman-Ford Shortest Path",
    FordFulkerson: "Ford-Fulkerson",
    FordFulkersonMaxFlowMinCut: "Ford-Fulkerson MaxFlow-MinCut",
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
    TopoSortErrorHTML: "<h3>Topological Sorting Failed</h3><hr>Topological sorting failed because the graph contains a cycle",

    NoPathFromAToB: "No path exists from $1 to $2",
    MaxFlowFromAToB: "Max flow from $1 to $2: $3",
    ShortestPathFromAToB: "$1 From $2 to $3: $4",
    WithWeightedCost: "With weighted cost: $1",
    UsingPath: "Using path: ",
    UsingEdges: "Using edges:",
    UsingCapacities: "Using capacities:",
    FlowWithCapacity: "$1 &rarr; $2 using $3 of $4",
    NumberOfConnectedComponents: "Number of $1: $2",
    VertexIsInConnectedComponentNumber: "Vertex $1 is in connected component #$2",
    NumberOfVertices: "Number of Vertices: $1",
    ChromaticNumberIs: "Chromatic Number: $1",
    VertexGetsColor: "Vertex $1 gets color $2",
    GraphColoringTitle: "Graph Coloring Using Welsh-Powell Algorithm",
    KruskalMSTTotalWeight: "Kruskal's Minimum Spanning Tree Total Weight: $1",

    // UI
    StartNode: "Start Node",
    EndNode: "End Node",
    SourceNode: "Source Node",
    SinkNode: "Sink Node",
    Go: "Go",
    Help: "Help",
    TaskAlreadyRunning: "Task Already Running",
    TaskAlreadyRunningBody: "$1 is already running, please wait for it to finish first.",
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
    ThisTask: "This task",
    ReColor: "Apply New Colors To Graph",
};