import gAlgo from "./GraphAlgorithms";
import gHelp from "./graphHelpers";
import settings from "./settings";
import help from "./genericHelpers";
import $ from "jquery";
import importExport from './dataImportExport';

export default class UIInteractions {
    static getAlgorithms () {
        return [
            {
                name: "Graph Coloring",
                directional: false,
                applyFunc: UIInteractions.makeAndPrintGraphColoring,
                display: true
            },
            {
                name: "Connected Components",
                directional: false,
                applyFunc: UIInteractions.makeAndPrintConnectedComponents,
                display: true
            },
            {
                name: "Strongly Connected Components",
                directional: true,
                display: true,
                applyFunc: UIInteractions.makeAndPrintStronglyConnectedComponents
            },
            {
                name: "Breadth-First Shortest Path",
                directional: false,
                applyFunc: UIInteractions.makeAndPrintBFS,
                display: true
            },
            {
                name: "Dijkstra Shortest Path",
                applyFunc: UIInteractions.makeAndPrintDijkstra,
                display: true
            },
            {
                name: "Bellman-Ford Shortest Path",
                weighted: true,
                directional: true,
                applyFunc: UIInteractions.makeAndPrintBFSP,
                display: true
            },
            {
                name: "Ford-Fulkerson",
                weighted: true,
                directional: true,
                applyFunc: UIInteractions.makeAndPrintFFMCMF,
                display: true
            },
            {
                name: "Kruskal Minimum Spanning Tree",
                weighted: true,
                directional: false,
                applyFunc: UIInteractions.makeAndPrintKruskal,
                display: true
            },
            {
                name: "Cyclic",
                applyFunc: UIInteractions.makeAndPrintIsCyclic,
                directional: true,
                display: true
            },
            {
                name: "Topological Sort",
                applyFunc: UIInteractions.makeAndPrintTopologicalSort,
                directional: true,
                display: true
            },
            {
                name: "Eulerian",
                directional: false,
                display: false,
                applyFunc: null
            },
            {
                name: "Eulerian",
                directional: true,
                display: true,
                applyFunc: UIInteractions.makeAndPrintDirectionalEulerian
            },
        ];
    }

    static registerListeners () {
        const makeSimpleClickListener = (selector, fn) => {
            $(selector).on("click", (e) => {
                e.preventDefault();
                fn();
            });
        };

        makeSimpleClickListener("#print-help-link", UIInteractions.printHelp);
        makeSimpleClickListener("#graph-options-link", UIInteractions.printOptions);
        makeSimpleClickListener("#load-petersen-link",
            () => {
                window.main.setData(window.predefined.Petersen(), false, true, true);
            });
        makeSimpleClickListener("#load-konigsberg-link",
            () => {
                window.main.setData(window.predefined.Konigsberg(), false, true, true);
            });
        makeSimpleClickListener("#load-complete-link", window.predefined.Complete);
        makeSimpleClickListener("#load-hypercube-link", window.predefined.Hypercube);
        makeSimpleClickListener("#load-custom-link", window.predefined.Custom);
        makeSimpleClickListener("#undo-link", window.main.undo);
        makeSimpleClickListener("#redo-link", window.main.redo);
        makeSimpleClickListener("#calculate-all-properties-link",
            () => {
                window.main.graphState.makeAndPrintProperties(true);
            });
        makeSimpleClickListener("#new-graph-layout-link", window.main.shuffleNetworkLayout);
        makeSimpleClickListener("#import-file-link", importExport.makeImportFileModal);
        makeSimpleClickListener("#import-text-link", importExport.makeImportTextModal);
        makeSimpleClickListener("#export-file-link", importExport.makeExportFileModal);
        makeSimpleClickListener("#export-text-link", importExport.makeExportTextModal);
    }

    static printHelp () {
        help.showSimpleModal("Help",
            "<h4>For support see the <a href='https://github.com/MikeDombo/graphPlayground' " +
            "target='_blank'>GitHub repository</a> for guides</h4>" +
            "<h4>See <a href='https://github.com/MikeDombo/graphPlayground/issues'" +
            " target='_blank'>GitHub issues</a> to submit bugs or feature requests.</h4>");
    }

    static printOptions () {
        help.showFormModal(
            ($modal, vals) => {
                $modal.modal("hide");
                if (settings.getOption("nodePhysics") !== vals[0]) {
                    settings.changeOption("nodePhysics", vals[0]); // Physics
                }
                if (settings.getOption("direction") !== vals[1]) {
                    settings.changeOption("direction", vals[1]);
                    let G = window.main.graphState.graph;
                    G = vals[1] ? G.convertToDirected(true) : G.getGraphAsUndirected();
                    // Clear node coloring because graph color doesn't apply to directed graphs
                    window.main.setData(window.main.graphState.getGraphData(G, true));
                }
                if (settings.getOption("weights") !== vals[2]) {
                    settings.changeOption("weights", vals[2]);
                    let G = window.main.graphState.graph;
                    G = vals[2] ? G.convertToWeighted() : G.convertToUnWeighted();
                    window.main.setData(window.main.graphState.getGraphData(G));
                }
            },
            "Options", "Save", [
                {label: "Graph Physics", initialValue: settings.getOption("nodePhysics"), type: "checkbox"},
                {label: "Directed Graph", initialValue: settings.getOption("direction"), type: "checkbox"},
                {label: "Weighted Graph", initialValue: settings.getOption("weights"), type: "checkbox"}
            ], null);
    }

    static makeAndPrintGraphColoring () {
        if (settings.getOption("direction")) {
            return;
        }

        // Use cached responses when able
        let a = {
            chromaticNumber: window.main.graphState.getProperty("Chromatic Number"),
            colors: window.main.graphState.state.graphColoring
        };
        if (!(a.chromaticNumber !== null && window.main.graphState.getProperty("graphColoring") !== null)) {
            a = gAlgo.colorNetwork();
        }

        window.main.graphState.graphProperties["Chromatic Number"] = a.chromaticNumber;
        window.main.graphState.setUpToDate(true, ["Chromatic Number", "graphColoring"]);
        window.main.graphState.state.graphColoring = a.colors;

        let colors = help.flatten(a.colors);
        let p = "Number of Vertices: " + colors.length;
        p += "\nChromatic Number: " + a.chromaticNumber;
        p += "\n\n";

        colors.forEach((v, i) => {
            p += "Vertex " + window.main.graphState.nodeIDToLabel(i) + " gets color " + v + "\n";
        });

        p += "\n" + JSON.stringify(help.rotate(a.colors), null, 4) + "\n\n";

        p = "<h3>Graph Coloring Using Welsh-Powell Algorithm</h3><hr>" + help.htmlEncode(p);
        p += "<br/><button class='btn btn-primary' onclick='main.applyColors()'>Apply New Colors To Graph</button>";

        help.printout(p);
        window.main.applyColors();
    }

    static makeAndPrintConnectedComponents () {
        if (settings.getOption("direction")) {
            return;
        }
        let a = gAlgo.connectedComponents();

        window.main.graphState.graphProperties["Connected Components"] = a.count;
        window.main.graphState.setUpToDate(true, ["Connected Components", "connectedComponents"]);
        window.main.graphState.state.connectedComponents = a.components;

        let components = help.flatten(a.components);
        let p = "Number of Connected Components: " + a.count;
        p += "\n\n";

        components.forEach((v, i) => {
            p += "Vertex " + window.main.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
        });

        p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

        p = "<h3>Connected Components</h3><hr>" + help.htmlEncode(p);

        help.printout(p);
    }

    static makeAndPrintDirectionalEulerian () {
        if (!settings.getOption("direction")) {
            return;
        }
        let t = gAlgo.directionalEulerian(gHelp.findVertexDegreesDirectional(window.main.graphState.graph.getFullAdjacency()));
        window.main.graphState.setUpToDate(true, ["eulerian"]);
        window.main.graphState.graphProperties.eulerian = t;
    }

    static makeAndPrintEulerian () {
        if (settings.getOption("direction")) {
            UIInteractions.makeAndPrintDirectionalEulerian();
            return;
        }

        window.main.graphState.setUpToDate(true, ["eulerian"]);
        window.main.graphState.graphProperties.eulerian = gAlgo.hasEulerianCircuit(window.main.graphState.graph.getAllOutDegrees());
    }

    static makeAndPrintStronglyConnectedComponents () {
        if (!settings.getOption("direction")) {
            return;
        }
        let a = gAlgo.stronglyConnectedComponents();

        window.main.graphState.graphProperties["Strongly Connected Components"] = a.count;
        window.main.graphState.setUpToDate(true, ["Strongly Connected Components", "stronglyConnectedComponents"]);
        window.main.graphState.state.stronglyConnectedComponents = a.components;

        let components = help.flatten(a.components);
        let p = "Number of Strongly Connected Components: " + a.count;
        p += "\n\n";

        components.forEach((v, i) => {
            p += "Vertex " + window.main.graphState.nodeIDToLabel(i) + " is in connected component #" + v + "\n";
        });

        p += "\n" + JSON.stringify(help.rotate(a.components), null, 4) + "\n\n";

        p = "<h3>Strongly Connected Components</h3><hr>" + help.htmlEncode(p);

        help.printout(p);
    }

    static makeAndPrintBFS () {
        help.showFormModal(($modal, values) => {
                $modal.modal("hide");

                let source = window.main.graphState.nodeLabelToID(values[0]);
                let sink = window.main.graphState.nodeLabelToID(values[1]);

                let a = gAlgo.breadthFirstSearch(source, sink);

                let p = "<h3>Breadth-First Shortest Path</h3><hr>No path exists from "
                    + help.htmlEncode(source) + " to " + help.htmlEncode(sink);

                if (a.pathExists) {
                    p = "Breadth-First Shortest Path From " + window.main.graphState.nodeIDToLabel(source) + " to ";
                    p += window.main.graphState.nodeIDToLabel(sink) + ": " + a.distance;
                    p += "\n\nUsing Path: ";

                    p = help.htmlEncode(p);
                    a.path.forEach((v) => {
                        p += help.htmlEncode(window.main.graphState.nodeIDToLabel(v)) + " &rarr; ";
                    });
                    p = p.slice(0, -8);
                    p = "<h3>Breadth-First Shortest Path</h3><hr>" + p;
                }

                help.printout(p);
            },
            "Breadth-First Shortest Path", "Go", [
                {label: "Start Node", type: "text", validationFunc: window.main.nodeLabelIDValidator},
                {label: "End Node", type: "text", validationFunc: window.main.nodeLabelIDValidator}
            ]);
    }

    static makeAndPrintDijkstra () {
        help.showFormModal(($modal, values) => {
                $modal.modal("hide");

                let source = window.main.graphState.nodeLabelToID(values[0]);
                let sink = window.main.graphState.nodeLabelToID(values[1]);

                let a = gAlgo.dijkstraSearch(source, sink);
                if (a === false) {
                    return;
                }

                let p = "<h3>Dijkstra Shortest Path</h3><hr>No path exists from "
                    + help.htmlEncode(window.main.graphState.nodeIDToLabel(source))
                    + " to " + help.htmlEncode(window.main.graphState.nodeIDToLabel(sink));

                if (a.pathExists) {
                    p = "Dijkstra Shortest Path Total Distance From "
                        + window.main.graphState.nodeIDToLabel(source) + " to "
                        + window.main.graphState.nodeIDToLabel(sink) + ": " + a.distance;
                    p += "\nWith weighted cost: " + a.cost;
                    p += "\n\nUsing Path: ";
                    p = help.htmlEncode(p);
                    a.path.forEach((v) => {
                        p += help.htmlEncode(window.main.graphState.nodeIDToLabel(v)) + " &rarr; ";
                    });
                    p = p.slice(0, -8);
                    p = "<h3>Dijkstra Shortest Path</h3><hr>" + p;
                }

                help.printout(p);
            },
            "Dijkstra Shortest Path", "Go", [
                {label: "Start Node", type: "text", validationFunc: window.main.nodeLabelIDValidator},
                {label: "End Node", type: "text", validationFunc: window.main.nodeLabelIDValidator}
            ]);
    }

    static makeAndPrintBFSP () {
        help.showFormModal(($modal, values) => {
                $modal.modal("hide");

                let source = window.main.graphState.nodeLabelToID(values[0]);
                let sink = window.main.graphState.nodeLabelToID(values[1]);

                let a = gAlgo.bellmanFord(source, sink);
                if (a === false) {
                    return;
                }

                let p = "<h3>Bellman-Ford Shortest Path</h3><hr>No path exists from "
                    + help.htmlEncode(window.main.graphState.nodeIDToLabel(source))
                    + " to " + help.htmlEncode(window.main.graphState.nodeIDToLabel(sink));

                if (a.pathExists) {
                    p = "Bellman-Ford Shortest Path Total Distance From " + window.main.graphState.nodeIDToLabel(source)
                        + " to " + window.main.graphState.nodeIDToLabel(sink) + ": " + a.distance;
                    p += "\nWith weighted cost: " + a.cost;
                    p += "\n\nUsing Path: ";
                    p = help.htmlEncode(p);
                    a.path.forEach((v) => {
                        p += help.htmlEncode(window.main.graphState.nodeIDToLabel(v)) + " &rarr; ";
                    });
                    p = p.slice(0, -8);
                    p = "<h3>Bellman-Ford Shortest Path</h3><hr>" + p;
                }

                help.printout(p);
            },
            "Bellman-Ford Shortest Path", "Go", [
                {label: "Start Node", type: "text", validationFunc: window.main.nodeLabelIDValidator},
                {label: "End Node", type: "text", validationFunc: window.main.nodeLabelIDValidator}
            ]);
    }

    static makeAndPrintFFMCMF () {
        if (!settings.getOption("direction") || !settings.getOption("weights")) {
            return;
        }
        help.showFormModal(($modal, values) => {
                $modal.modal("hide");

                let source = window.main.graphState.nodeLabelToID(values[0]);
                let sink = window.main.graphState.nodeLabelToID(values[1]);

                let a = gAlgo.fordFulkerson(source, sink);

                let p = "<h3>Ford-Fulkerson</h3><hr>No path exists from "
                    + help.htmlEncode(window.main.graphState.nodeIDToLabel(source))
                    + " to " + help.htmlEncode(window.main.graphState.nodeIDToLabel(sink));

                if (a === false) {
                    help.printout(p);
                    return;
                }

                p = "Ford-Fulkerson MaxFlow-MinCut Max Flow From " + window.main.graphState.nodeIDToLabel(source)
                    + " to " + window.main.graphState.nodeIDToLabel(sink) + ": " + a.maxFlow;
                p += "\n\nUsing Capacities:\n\n";
                p = help.htmlEncode(p);
                a.flowPath.forEach((v) => {
                    p += window.main.graphState.nodeIDToLabel(v.from) + "&rarr;" + window.main.graphState.nodeIDToLabel(v.to)
                        + " using " + v.flow + " of " + v.capacity + " \n";
                });
                p = p.trim();
                p = "<h3>Ford-Fulkerson MaxFlow-MinCut</h3><hr>" + p;

                help.printout(p);
            },
            "Ford-Fulkerson MaxFlow-MinCut", "Go", [
                {label: "Source Node", type: "text", validationFunc: window.main.nodeLabelIDValidator},
                {label: "Sink Node", type: "text", validationFunc: window.main.nodeLabelIDValidator}
            ]);
    }

    static makeAndPrintKruskal () {
        if (settings.getOption("direction") || !settings.getOption("weights")) {
            return;
        }

        let a = gAlgo.kruskal();

        let p = "Kruskal's Minimum Spanning Tree Total Weight: " + a.totalWeight;
        p += "\n\nUsing Edges:\n\n";
        p = help.htmlEncode(p);
        a.mst.forEach((v) => {
            p += window.main.graphState.nodeIDToLabel(v.from) + "&rarr;" + window.main.graphState.nodeIDToLabel(v.to) + " \n";
        });
        p = p.trim();
        p = "<h3>Kruskal Minimum Spanning Tree</h3><hr>" + p;

        help.printout(p);
    }

    static makeAndPrintIsCyclic () {
        if (!settings.getOption("direction")) {
            return;
        }
        window.main.graphState.graphProperties.cyclic = gAlgo.isGraphCyclic();
        window.main.graphState.setUpToDate(true, ["cyclic"]);
    }

    static makeAndPrintTopologicalSort () {
        if (!settings.getOption("direction")) {
            return;
        }

        let a = gAlgo.topologicalSort();

        if (a === true) {
            window.main.graphState.graphProperties.cyclic = true;
            window.main.graphState.setUpToDate(true, ["cyclic"]);

            let p = "Topological sorting failed because the graph contains a cycle";
            p = "<h3>Topological Sorting Failed</h3><hr>" + p;
            help.printout(p);

            return;
        }

        let p = "Topological Sorting:\n\n";
        p = help.htmlEncode(p);
        a.forEach((v) => {
            p += window.main.graphState.nodeIDToLabel(v.id) + ", ";
        });
        p = p.slice(0, -2);
        p = "<h3>Topological Sorting</h3><hr>" + p;

        help.printout(p);
    }

    static printGraphAlgorithms () {
        let $div = $("#algorithms-pane");
        $div.empty();
        let directional = settings.getOption("direction");
        let weighted = settings.getOption("weights");

        const addAlgoToPane = (alg) => {
            $div.append($("<a>", {class: "nav-link", href: "#"})
                .text(alg.name).on("click", (e) => {
                    e.preventDefault();
                    alg.applyFunc();
                }));
        };

        let a = UIInteractions.getAlgorithms();
        a.forEach((alg) => {
            if (!alg.display) {
                return;
            }
            if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                    addAlgoToPane(alg);
                }
            }
            else if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                    addAlgoToPane(alg);
                }
            }
        });
    }
}
