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
    Cancel: "Cancel",
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
    File: "File",
    ImportFile: "Import File",
    ImportText: "Import Text",
    ExportFile: "Export File",
    ExportText: "Export Text",
    CalculateAllProperties: "Calculate All Properties",
    NewGraphLayout: "New Graph Layout",
    GraphOptions: "Graph Options",
    ExampleGraphs: "Example Graphs",
    LoadPetersen: "Load Petersen Graph",
    LoadKonigsberg: "Load Königsberg Bridges Graph",
    LoadComplete: "Load Complete Graph",
    LoadHypercube: "Load Hypercube Graph",
    LoadCustom: "Load Custom Graph",
    Algorithms: "Algorithms",
    GraphProperties: "Graph Properties",
    Results: "Results",
    AddNode: "Add Node",
    EditEdge: "Edit Edge",
    EditNode: "Edit Node",
    WeightCapacity: "Weight/Capacity",
    LabelLabel: "Label",
    NodeId: "Node ID: $1",
    Color: "Color",
    ConnectNodeToItselfConfirmation: "Do you want to connect the node to itself?",
    InvalidLabelOrId: "Invalid Label or ID",


    // Import/Export
    DataImportError: "Data Import Error",
    DataImportErrorText: "The provided input does not conform the the import specifications.",
    JsonParseError: "JSON Parse Error",
    JsonParseErrorText: "There was an error parsing your input as JSON.",
    DimacsParseError: "DIMACS Parse Error",
    DimacsParseErrorText: "Sorry, but I only know how to parse \"edge\" formatted DIMACS files.",
    DimacsParseErrorNoProgram: "No program line found!",
    UnrecognizedInputError: "Unrecognized Input Format",
    ImportGraphFromText: "Import Graph From Text",
    ImportGraphFromFile: "Import Graph From File",
    Import: "Import",
    ExportToJson: "Export to JSON",
    ExportToDimacs: "Export to DIMACS",
    ExportGraphToFile: "Export Graph To File",
    ExportGraphToText: "Export Graph To Text",
    Format: "Format",
    InputText: "Input Text",
    UploadFile: "Upload File",
    MustChooseFileError: "You must choose a file first",

    // Predefined Graphs
    ConfigurableCompleteGraph: "Configurable Complete Graph",
    NumberOfVerticesLabel: "Number of Vertices",
    NumberOfVerticesNonNegativeError: "Number of vertices must be non-negative",
    ConfigurableGraph: "Configurable Graph",
    ConfigurableHypercubeGraph: "Configurable Hypercube Graph",
    NumberOfDimensionsLabel: "Number of Dimensions",
    NumberOfDimensionsNonNegativeError: "Number of dimensions must be non-negative",

    // VisJS locale
    VisLocale: {
        "en": {}, // Required, even though we will not use it.
        // Customize the text below...
        "": {
            edit: 'Edit',
            del: 'Delete selected',
            back: 'Back',
            addNode: 'Add Node',
            addEdge: 'Add Edge',
            editNode: 'Edit Node',
            editEdge: 'Edit Edge',
            addDescription: 'Click in an empty space to place a new node.',
            edgeDescription: 'Click on a node and drag the edge to another node to connect them.',
            editEdgeDescription: 'Click on the control points and drag them to a node to connect to it.',
            createEdgeError: 'Cannot link edges to a cluster.',
            deleteClusterError: 'Clusters cannot be deleted.',
            editClusterError: 'Clusters cannot be edited.'
        }
    }
};
