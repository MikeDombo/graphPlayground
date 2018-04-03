import gHelp from "./graphHelpers";
import help from "./genericHelpers";
import * as $ from "jquery";
import GraphState from './graphState';
import GraphAlgorithms from "./GraphAlgorithms";

interface ShortestPathResult {
    pathExists: boolean;
    cost?: number;
    distance: number;
    path: number[]
}

export interface AlgorithmI {
    name: string;
    directional?: boolean;
    weighted?: boolean;
    applyFunc: () => any;
    display: boolean
}

export interface UIInteractionsI {
    getAlgorithms(): AlgorithmI[];

    registerListeners(): void;

    printHelp(): void;

    printOptions(): void;

    makeAndPrintGraphColoring(): Promise<void>;

    makeAndPrintConnectedComponents(): Promise<void>;

    makeAndPrintDirectionalEulerian(): Promise<void>;

    makeAndPrintEulerian(): Promise<void>;

    makeAndPrintStronglyConnectedComponents(): Promise<void>;

    makeAndPrintBFS(): Promise<void>;

    makeAndPrintDijkstra(): Promise<void>;

    makeAndPrintBFSP(): Promise<void>;

    makeAndPrintFFMCMF(): void;

    makeAndPrintKruskal(): Promise<void>;

    makeAndPrintIsCyclic(): Promise<void>;

    makeAndPrintTopologicalSort(): Promise<void>;

    printGraphAlgorithms(): void;
}

const makeAndPrintShortestPath = (title: string,
                                  fn: (a: number, b: number) => boolean | ShortestPathResult,
                                  weighted: boolean): void => {
    help.showFormModal(($modal, values) => {
            $modal.modal("hide");

            const source = GraphState.nodeLabelToID(values[0]);
            const sink = GraphState.nodeLabelToID(values[1]);

            let a = fn(source, sink);
            if (a === false) {
                return;
            }

            a = a as ShortestPathResult;

            let p = `<h3>${title}</h3><hr>No path exists from ${help.htmlEncode(source.toString())} to ${help.htmlEncode(sink.toString())}`;

            if (a.pathExists) {
                p = `${title} From ${GraphState.nodeIDToLabel(source)} to `;
                p += `${GraphState.nodeIDToLabel(sink)}: ${a.distance}`;
                if (weighted) {
                    p += `\nWith weighted cost: ${a.cost}`;
                }
                p += "\n\nUsing Path: ";

                p = help.htmlEncode(p);
                a.path.forEach((v) => {
                    p += `${help.htmlEncode(GraphState.nodeIDToLabel(v))} &rarr; `;
                });
                p = p.slice(0, -8);
                p = `<h3>${title}</h3><hr>${p}`;
            }

            help.printout(p);
        },
        title, "Go", [
            {label: "Start Node", type: "text", validationFunc: window.main.nodeLabelIDValidator},
            {label: "End Node", type: "text", validationFunc: window.main.nodeLabelIDValidator}
        ]);
};

const callWithGraphAlgorithms = async (f: (gAlgo: GraphAlgorithms) => any): Promise<any> => {
    const gAlgo = new ((await import("./GraphAlgorithms")).default)();
    return f(gAlgo);
};

const makeAndPrintComponents = async (stronglyConnected: boolean): Promise<any> => {
    let a = null;
    let cc = "Connected Components";
    let componentKey = "connectedComponents";

    const gAlgo = new ((await import("./GraphAlgorithms")).default)();
    if (stronglyConnected) {
        if (!window.settings.getOption("direction")) {
            return;
        }
        cc = "Strongly " + cc;
        componentKey = "stronglyConnectedComponents";
        a = await gAlgo.stronglyConnectedComponents();
    }
    else {
        if (window.settings.getOption("direction")) {
            return;
        }
        a = await gAlgo.connectedComponents();
    }

    GraphState.graphProperties[cc] = a.count;
    GraphState.setUpToDate(true, [cc, componentKey]);
    GraphState.state[componentKey] = a.components;

    const components = help.flatten(a.components);
    let p = `Number of ${cc}: ${a.count}`;
    p += "\n\n";

    components.forEach((v, i) => {
        p += `Vertex ${GraphState.nodeIDToLabel(i)} is in connected component #${v}\n`;
    });

    p += `\n${JSON.stringify(help.rotate(a.components), null, 4)}\n\n`;
    p = `<h3>${cc}</h3><hr>${help.htmlEncode(p)}`;

    help.printout(p);

    return Promise.resolve("hi");
};

export default class UIInteractions {
    static getAlgorithms(): AlgorithmI[] {
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
        ] as AlgorithmI[];
    }

    static registerListeners(): void {
        const makeSimpleClickListener = (selector: string, fn: () => void) => {
            $(selector).on("click", (e) => {
                e.preventDefault();
                fn();
            });
        };

        makeSimpleClickListener("#print-help-link", UIInteractions.printHelp);
        makeSimpleClickListener("#graph-options-link", UIInteractions.printOptions);
        makeSimpleClickListener("#load-petersen-link", async () => {
            const predefined = (await import('./predefinedGraphs')).default;
            window.main.setData(predefined.Petersen(), false, true, true);
        });
        makeSimpleClickListener("#load-konigsberg-link", async () => {
            const predefined = (await import('./predefinedGraphs')).default;
            window.main.setData(predefined.Konigsberg(), false, true, true);
        });
        makeSimpleClickListener("#load-complete-link", async () => {
            const predefined = (await import('./predefinedGraphs')).default;
            predefined.Complete();
        });
        makeSimpleClickListener("#load-hypercube-link", async () => {
            const predefined = (await import('./predefinedGraphs')).default;
            predefined.Hypercube();
        });
        makeSimpleClickListener("#load-custom-link", async () => {
            const predefined = (await import('./predefinedGraphs')).default;
            predefined.Custom();
        });
        makeSimpleClickListener("#undo-link", window.main.undo);
        makeSimpleClickListener("#redo-link", window.main.redo);
        makeSimpleClickListener("#calculate-all-properties-link", async () => {
            return GraphState.makeAndPrintProperties(true);
        });
        makeSimpleClickListener("#new-graph-layout-link", window.main.shuffleNetworkLayout);
        makeSimpleClickListener("#import-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportFileModal();
        });
        makeSimpleClickListener("#import-text-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportTextModal();
        });
        makeSimpleClickListener("#export-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeExportFileModal();
        });
        makeSimpleClickListener("#export-text-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeExportTextModal();
        });
    }

    static printHelp(): void {
        help.showSimpleModal("Help", "<h4>For support see the <a href='https://github.com/MikeDombo/graphPlayground' " +
            "target='_blank'>GitHub repository</a> for guides</h4> <h4>See " +
            "<a href='https://github.com/MikeDombo/graphPlayground/issues' target='_blank'>GitHub issues</a>" +
            " to submit bugs or feature requests.</h4>");
    }

    static printOptions(): void {
        help.showFormModal(
            ($modal, vals) => {
                $modal.modal("hide");
                if (window.settings.getOption("nodePhysics") !== vals[0]) {
                    window.settings.changeOption("nodePhysics", vals[0]); // Physics
                }
                if (window.settings.getOption("direction") !== vals[1]) {
                    window.settings.changeOption("direction", vals[1]);
                    let G = GraphState.graph;
                    G = vals[1] ? G.asDirected(true) : G.asUndirected();
                    // Clear node coloring because graph color doesn't apply to directed graphs
                    window.main.setData(GraphState.getGraphData(G, true));
                }
                if (window.settings.getOption("weights") !== vals[2]) {
                    window.settings.changeOption("weights", vals[2]);
                    let G = GraphState.graph;
                    G = vals[2] ? G.asWeighted() : G.asUnweighted();
                    window.main.setData(GraphState.getGraphData(G));
                }
            },
            "Options", "Save", [
                {label: "Graph Physics", initialValue: window.settings.getOption("nodePhysics"), type: "checkbox"},
                {label: "Directed Graph", initialValue: window.settings.getOption("direction"), type: "checkbox"},
                {label: "Weighted Graph", initialValue: window.settings.getOption("weights"), type: "checkbox"}
            ], null);
    }

    static async makeAndPrintGraphColoring(): Promise<void> {
        if (window.settings.getOption("direction")) {
            return;
        }

        // Use cached responses when able
        let a = {
            chromaticNumber: (await GraphState.getProperty("Chromatic Number")) as number,
            colors: GraphState.state.graphColoring as {}
        };
        if (!(a.chromaticNumber !== null && (await GraphState.getProperty("graphColoring")) !== null)) {
            const gAlgo = new ((await import("./GraphAlgorithms")).default)();
            a = gAlgo.colorNetwork();
        }

        (GraphState.graphProperties["Chromatic Number"] as number) = a.chromaticNumber;
        GraphState.setUpToDate(true, ["Chromatic Number", "graphColoring"]);
        (GraphState.state.graphColoring as {}) = a.colors;

        const colors = help.flatten(a.colors);
        let p = `Number of Vertices: ${colors.length}`;
        p += `\nChromatic Number: ${a.chromaticNumber}`;
        p += "\n\n";

        colors.forEach((v, i) => {
            p += `Vertex ${GraphState.nodeIDToLabel(i)} gets color ${v}\n`;
        });

        p += `\n${JSON.stringify(help.rotate(a.colors), null, 4)}\n\n`;

        p = `<h3>Graph Coloring Using Welsh-Powell Algorithm</h3><hr>${help.htmlEncode(p)}`;
        p += "<br/><button class='btn btn-primary' onclick='main.applyColors()'>Apply New Colors To Graph</button>";

        help.printout(p);
        window.main.applyColors();
    }

    static makeAndPrintConnectedComponents(): Promise<void> {
        return makeAndPrintComponents(false);
    }

    static makeAndPrintDirectionalEulerian(): Promise<void> {
        if (!window.settings.getOption("direction")) {
            return;
        }
        return callWithGraphAlgorithms(async (gAlgo) => {
            GraphState.graphProperties.eulerian = await gAlgo.directionalEulerian(
                gHelp.findVertexDegreesDirectional(
                    GraphState.graph.getFullAdjacency()));
            GraphState.setUpToDate(true, ["eulerian"]);
        });
    }

    static makeAndPrintEulerian(): Promise<void> {
        if (window.settings.getOption("direction")) {
            return UIInteractions.makeAndPrintDirectionalEulerian();
        }

        return callWithGraphAlgorithms(async (gAlgo) => {
            GraphState.graphProperties.eulerian = await gAlgo.hasEulerianCircuit(GraphState.graph.getAllOutDegrees());
            GraphState.setUpToDate(true, ["eulerian"]);
        });
    }

    static makeAndPrintStronglyConnectedComponents(): Promise<void> {
        return makeAndPrintComponents(true);
    }

    static makeAndPrintBFS(): Promise<void> {
        return callWithGraphAlgorithms((gAlgo) => {
            makeAndPrintShortestPath("Breadth-First Shortest Path", gAlgo.breadthFirstSearch as any, false);
        });
    }

    static makeAndPrintDijkstra(): Promise<void> {
        return callWithGraphAlgorithms((gAlgo) => {
            makeAndPrintShortestPath("Dijkstra Shortest Path", gAlgo.dijkstraSearch as any, true);
        });
    }

    static makeAndPrintBFSP(): Promise<void> {
        return callWithGraphAlgorithms((gAlgo) => {
            makeAndPrintShortestPath("Bellman-Ford Shortest Path", gAlgo.bellmanFord as any, true);
        });
    }

    static makeAndPrintFFMCMF(): void {
        if (!window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }
        help.showFormModal(async ($modal, values) => {
                $modal.modal("hide");

                const source = GraphState.nodeLabelToID(values[0]);
                const sink = GraphState.nodeLabelToID(values[1]);
                const gAlgo = new ((await import("./GraphAlgorithms")).default)();
                let a = gAlgo.fordFulkerson(source, sink);

                let p = `<h3>Ford-Fulkerson</h3><hr>No path exists from ${help.htmlEncode(GraphState.nodeIDToLabel(source))} to ${help.htmlEncode(GraphState.nodeIDToLabel(sink))}`;

                if (a === false) {
                    help.printout(p);
                    return;
                }
                a = a as { maxFlow: number; flowPath: any[] };

                p = `Ford-Fulkerson MaxFlow-MinCut Max Flow From ${GraphState.nodeIDToLabel(source)} to ${GraphState.nodeIDToLabel(sink)}: ${a.maxFlow}`;
                p += "\n\nUsing Capacities:\n\n";
                p = help.htmlEncode(p);
                a.flowPath.forEach((v) => {
                    p += `${GraphState.nodeIDToLabel(v.from)}&rarr;${GraphState.nodeIDToLabel(v.to)} using ${v.flow} of ${v.capacity}\n`;
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

    static makeAndPrintKruskal(): Promise<void> {
        if (window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }
        return callWithGraphAlgorithms((gAlgo) => {
            const a = gAlgo.kruskal();

            let p = `Kruskal's Minimum Spanning Tree Total Weight: ${a.totalWeight}`;
            p += "\n\nUsing Edges:\n\n";
            p = help.htmlEncode(p);
            a.mst.forEach((v) => {
                p += `${GraphState.nodeIDToLabel(v.from)}&rarr;${GraphState.nodeIDToLabel(v.to)}\n`;
            });
            p = p.trim();
            p = `<h3>Kruskal Minimum Spanning Tree</h3><hr>${p}`;

            help.printout(p);
        });
    }

    static async makeAndPrintIsCyclic(): Promise<void> {
        if (!window.settings.getOption("direction")) {
            return;
        }
        return callWithGraphAlgorithms((gAlgo) => {
            GraphState.graphProperties.cyclic = gAlgo.isGraphCyclic();
            GraphState.setUpToDate(true, ["cyclic"]);
        });
    }

    static makeAndPrintTopologicalSort(): Promise<void> {
        if (!window.settings.getOption("direction")) {
            return;
        }
        return callWithGraphAlgorithms((gAlgo) => {
            const a = gAlgo.topologicalSort();

            if (a === true) {
                GraphState.graphProperties.cyclic = true;
                GraphState.setUpToDate(true, ["cyclic"]);

                help.printout("<h3>Topological Sorting Failed</h3><hr>Topological sorting failed because the graph contains a cycle");

                return;
            }

            let p = "Topological Sorting:\n\n";
            p = help.htmlEncode(p);
            (a as any[]).forEach((v) => {
                p += `${GraphState.nodeIDToLabel(v.id)}, `;
            });
            p = p.slice(0, -2);
            p = `<h3>Topological Sorting</h3><hr>${p}`;

            help.printout(p);
        });
    }

    static printGraphAlgorithms(): void {
        const $div = $("#algorithms-pane");
        $div.empty();
        const directional = window.settings.getOption("direction");
        const weighted = window.settings.getOption("weights");

        const addAlgoToPane = (alg: AlgorithmI) => {
            $div.append($("<a>", {class: "nav-link", href: "#"})
                .text(alg.name).on("click", (e) => {
                    e.preventDefault();
                    alg.applyFunc();
                }));
        };

        const a = UIInteractions.getAlgorithms();
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
