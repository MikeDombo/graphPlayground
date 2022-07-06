import gHelp from "./util/graphHelpers";
import help from "./util/genericHelpers";
import GraphState from "./graphState";
import { FlowResult, MSTResult, ShortestPathResult } from "./GraphAlgorithms";
//@ts-ignore
import Worker from "worker-loader!./workers/GraphAlgorithmWorker";
import NodeImmut from "./classes/GraphImmut/NodeImmut";
import EdgeImmut from "./classes/GraphImmut/EdgeImmut";
import GraphImmut from "./classes/GraphImmut/GraphImmut";
import * as languages from "./languages";

interface AlgorithmI {
    name: string;
    directional?: boolean;
    weighted?: boolean;
    applyFunc: () => any;
    display: boolean;
}

const makeAndPrintShortestPath = (title: string, fn: string, weighted: boolean): void => {
    const myName = languages.current.ShortestPath;
    if (UIInteractions.isRunning[myName]) {
        UIInteractions.printAlreadyRunning(myName);
        return;
    }
    UIInteractions.isRunning[myName] = true;

    help.showFormModal(
        ($modal, values) => {
            $modal.modal("hide");

            const source = GraphState.nodeLabelToID(values[0]);
            const sink = GraphState.nodeLabelToID(values[1]);

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                let a = e.data;
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;

                if (a === false) {
                    if (fn.includes("dijkstra")) {
                        help.showSimpleModal(
                            languages.current.DijkstraError,
                            languages.current.DijkstraErrorHTML
                        );
                    } else if (fn.includes("bellman")) {
                        help.showSimpleModal(
                            languages.current.BellmanFordError,
                            languages.current.BellmanFordErrorHTML
                        );
                    }
                    return;
                }

                a = a as ShortestPathResult;

                let p = `<h3>${title}</h3><hr>${help.stringReplacement(languages.current.NoPathFromAToB,
                    help.htmlEncode(source.toString()), help.htmlEncode(sink.toString()))}`;

                if (a.pathExists) {
                    p = help.stringReplacement(languages.current.ShortestPathFromAToB, title,
                        GraphState.nodeIDToLabel(source), GraphState.nodeIDToLabel(sink), a.distance);
                    if (weighted) {
                        p += `\n${help.stringReplacement(languages.current.WithWeightedCost, a.cost)}`;
                    }
                    p += "\n\n" + languages.current.UsingPath;

                    p = help.htmlEncode(p);
                    let graph = GraphState.getGraphData(GraphState.graph, false, true);
                    let G = new GraphImmut(graph.nodes, graph.edges, graph.directed, graph.weighted);
                    a.path.forEach((v: number, i: number) => {
                        p += `${help.htmlEncode(GraphState.nodeIDToLabel(v))} &rarr; `;
                        if (i > 0) {
                            G = G.editEdge(a.path[i - 1], v, null, null, "#FF0000") as GraphImmut;
                        }
                    });
                    GraphState.graph = G;
                    window.main.setData(GraphState.getGraphData(G), false, false, false);
                    p = p.slice(0, -8);
                    p = `<h3>${title}</h3><hr>${p}`;
                }

                help.printout(p);
            });
            w.send({
                type: fn,
                args: [source, sink],
                convertToGraphImmut: true,
                graph: window.main.graphState.getGraphData()
            });
        },
        title,
        languages.current.Go,
        languages.current.Cancel,
        [
            {
                label: languages.current.StartNode,
                type: "text",
                validationFunc: window.main.nodeLabelIDValidator
            },
            {
                label: languages.current.EndNode,
                type: "text",
                validationFunc: window.main.nodeLabelIDValidator
            }
        ],
        ($modal) => {
            UIInteractions.isRunning[myName] = false;
            $modal.modal("hide");
        }
    );
};

const makeAndPrintComponents = async (stronglyConnected: boolean): Promise<void> => {
    let a = null;
    let cc = languages.current.ConnectedComponents;
    let componentKey = "connectedComponents";

    if (stronglyConnected) {
        if (!window.settings.getOption("direction")) {
            return;
        }
        cc = languages.current.StronglyConnectedComponents;
        componentKey = "stronglyConnectedComponents";
    } else {
        if (window.settings.getOption("direction")) {
            return;
        }
    }

    if (UIInteractions.isRunning[cc]) {
        UIInteractions.printAlreadyRunning(cc);
        return Promise.reject(languages.current.TaskAlreadyRunning);
    }
    UIInteractions.isRunning[cc] = true;

    const iStartedProgress = UIInteractions.startLoadingAnimation();
    const w = UIInteractions.getWorkerIfPossible(e => {
        a = e.data;
        w.cleanup();

        GraphState.graphProperties[cc] = a.count;
        GraphState.setUpToDate(true, [cc, componentKey]);
        GraphState.state[componentKey] = a.components;

        const components = help.flatten(a.components);
        let p = help.stringReplacement(languages.current.NumberOfConnectedComponents, cc, a.count);
        p += "\n\n";

        components.forEach((v, i) => {
            p += help.stringReplacement(languages.current.VertexIsInConnectedComponentNumber, GraphState.nodeIDToLabel(i), v + "") + "\n";
        });

        p += `\n${JSON.stringify(help.rotate(a.components), null, 4)}\n\n`;
        p = `<h3>${cc}</h3><hr>${help.htmlEncode(p)}`;

        if (iStartedProgress) {
            UIInteractions.stopLoadingAnimation();
        }
        UIInteractions.isRunning[cc] = false;

        help.printout(p);
    });
    w.send({
        type: componentKey,
        args: [],
        graph: window.main.graphState.getGraphData(),
        convertToGraphImmut: true
    });
};

class WorkerProxy {
    private readonly worker: Worker;
    private readonly id: number;
    private readonly listener: (e: { data: any }) => any;

    constructor(id: number, w: Worker, listener: ((e: { data: any }) => any)) {
        this.id = id;
        this.worker = w;
        this.listener = listener;
        w.postMessage({ type: "id", id });
        w.onmessage = (e: MessageEvent) => {
            this.listener({ data: e.data.data });
        };
    }

    public send(data: any) {
        this.worker.postMessage(data);
    }

    public cleanup() {
        this.worker.terminate();
        GraphState.workerPool[this.id] = null;
    }
}

export default class UIInteractions {
    public static isRunning: { [index: string]: boolean } = {};
    static getAlgorithms(): AlgorithmI[] {
        return [
            {
                name: languages.current.GraphColoring,
                directional: false,
                applyFunc: UIInteractions.makeAndPrintGraphColoring,
                display: true
            },
            {
                name: languages.current.ConnectedComponents,
                directional: false,
                applyFunc: () => {
                    makeAndPrintComponents(false);
                },
                display: true
            },
            {
                name: languages.current.StronglyConnectedComponents,
                directional: true,
                display: true,
                applyFunc: () => {
                    makeAndPrintComponents(true);
                }
            },
            {
                name: languages.current.BFS,
                directional: false,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.BFS, "breadthFirstSearch", false);
                },
                display: true
            },
            {
                name: languages.current.Dijkstra,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.Dijkstra, "dijkstraSearch", true);
                },
                display: true
            },
            {
                name: languages.current.BellmanFord,
                weighted: true,
                directional: true,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.BellmanFord, "bellmanFord", true);
                },
                display: true
            },
            {
                name: languages.current.FordFulkerson,
                weighted: true,
                directional: true,
                applyFunc: UIInteractions.makeAndPrintFFMCMF,
                display: true
            },
            {
                name: languages.current.KruskalMST,
                weighted: true,
                directional: false,
                applyFunc: UIInteractions.makeAndPrintKruskal,
                display: true
            },
            {
                name: languages.current.Cyclic,
                applyFunc: UIInteractions.makeAndPrintIsCyclic,
                directional: true,
                display: true
            },
            {
                name: languages.current.TopoSort,
                applyFunc: UIInteractions.makeAndPrintTopologicalSort,
                directional: true,
                display: true
            },
            {
                name: languages.current.Eulerian,
                directional: false,
                display: false,
                applyFunc: null
            },
            {
                name: languages.current.Eulerian,
                directional: true,
                display: true,
                applyFunc: UIInteractions.makeAndPrintDirectionalEulerian
            }
        ] as AlgorithmI[];
    }

    static registerListeners(): void {
        const makeSimpleClickListener = (selector: string, fn: () => any) => {
            document.querySelector(selector)!.addEventListener("click", e => {
                e.preventDefault();
                fn();
            });
        };

        makeSimpleClickListener("#print-help-link", UIInteractions.printHelp);
        makeSimpleClickListener("#graph-options-link", UIInteractions.printOptions);
        makeSimpleClickListener("#load-petersen-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            window.main.setData(predefined.Petersen(), false, true, true);
        });
        makeSimpleClickListener("#load-konigsberg-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            window.main.setData(predefined.Konigsberg(), false, true, true);
        });
        makeSimpleClickListener("#load-complete-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Complete();
        });
        makeSimpleClickListener("#load-hypercube-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Hypercube();
        });
        makeSimpleClickListener("#load-custom-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
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
        (document.querySelector("#fileDropdown") as HTMLAnchorElement).innerText = languages.current.File;
        (document.querySelector("#import-file-link") as HTMLAnchorElement).innerText = languages.current.ImportFile;
        (document.querySelector("#import-text-link") as HTMLAnchorElement).innerText = languages.current.ImportText;
        (document.querySelector("#export-file-link") as HTMLAnchorElement).innerText = languages.current.ExportFile;
        (document.querySelector("#export-text-link") as HTMLAnchorElement).innerText = languages.current.ExportText;

        (document.querySelector("#calculate-all-properties-link") as HTMLAnchorElement).innerText = languages.current.CalculateAllProperties;
        (document.querySelector("#new-graph-layout-link") as HTMLAnchorElement).innerText = languages.current.NewGraphLayout;
        (document.querySelector("#graph-options-link") as HTMLAnchorElement).innerText = languages.current.GraphOptions;
        (document.querySelector("#print-help-link") as HTMLAnchorElement).innerText = languages.current.Help;

        (document.querySelector("#example-graphs-label") as HTMLHeadingElement).innerText = languages.current.ExampleGraphs;
        (document.querySelector("#load-petersen-link") as HTMLAnchorElement).innerText = languages.current.LoadPetersen;
        (document.querySelector("#load-konigsberg-link") as HTMLAnchorElement).innerText = languages.current.LoadKonigsberg;
        (document.querySelector("#load-complete-link") as HTMLAnchorElement).innerText = languages.current.LoadComplete;
        (document.querySelector("#load-hypercube-link") as HTMLAnchorElement).innerText = languages.current.LoadHypercube;
        (document.querySelector("#load-custom-link") as HTMLAnchorElement).innerText = languages.current.LoadCustom;

        (document.querySelector("#algorithms-label") as HTMLHeadElement).innerText = languages.current.Algorithms;

        (document.querySelector("#graph-properties-label") as HTMLHeadElement).innerText = languages.current.GraphProperties;
        (document.querySelector("#results-label") as HTMLHeadElement).innerText = languages.current.Results;
    }

    static printHelp(): void {
        help.showSimpleModal(
            languages.current.Help,
            languages.current.IssuesHTML
        );
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
                if (window.settings.getOption("customColors") !== vals[3]) {
                    window.settings.changeOption("customColors", vals[3]);
                }
            },
            languages.current.Options,
            languages.current.Save,
            languages.current.Cancel,
            [
                {
                    label: languages.current.GraphPhysics,
                    initialValue: window.settings.getOption("nodePhysics"),
                    type: "checkbox"
                },
                {
                    label: languages.current.DiGraph,
                    initialValue: window.settings.getOption("direction"),
                    type: "checkbox"
                },
                {
                    label: languages.current.WeightedGraph,
                    initialValue: window.settings.getOption("weights"),
                    type: "checkbox"
                },
                {
                    label: languages.current.CustomNodeColors,
                    initialValue: window.settings.getOption("customColors"),
                    type: "checkbox"
                }
            ],
            null
        );
    }

    static terminateAllWebWorkers(): void {
        for (const v of GraphState.workerPool) {
            if (v !== null && v instanceof window.Worker) {
                v.terminate();
            }
        }
        // Cleanup state
        GraphState.workerPool = [];
        UIInteractions.stopLoadingAnimation();
        UIInteractions.isRunning = {};
    }

    static getWorkerIfPossible(onmessage: (d: { data: any }) => any): WorkerProxy {
        let nextIndex = GraphState.workerPool.findIndex(v => {
            return v === null || typeof v === "undefined";
        });
        if (nextIndex === -1) {
            nextIndex = GraphState.workerPool.length;
        }

        const w = new Worker();
        GraphState.workerPool[nextIndex] = w;
        return new WorkerProxy(nextIndex, w, onmessage);
    }

    static startLoadingAnimation() {
        const prog = document.getElementById("task-spinner")!;
        if (prog.style.display !== "flex") {
            prog.style.display = "flex";
            return true;
        }
        return false;
    }

    static stopLoadingAnimation() {
        const prog = document.getElementById("task-spinner")!;
        if (prog.style.display !== "none") {
            prog.style.display = "none";
        }
    }

    static printAlreadyRunning(name?: string) {
        let n = languages.current.ThisTask;
        if (name) {
            n = name;
        }
        help.showSimpleModal(
            languages.current.TaskAlreadyRunning,
            "<p>" + help.stringReplacement(languages.current.TaskAlreadyRunningBody, n) + "</p>"
        );
    }

    static makeAndPrintGraphColoring(): Promise<void> {
        const myName = languages.current.GraphColoring;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            // Use cached responses when able
            let a = {
                chromaticNumber: (await GraphState.getProperty("Chromatic Number")) as number,
                colors: GraphState.state.graphColoring as {}
            };

            const printGC = () => {
                GraphState.graphProperties["Chromatic Number"] = a.chromaticNumber;
                GraphState.setUpToDate(true, ["Chromatic Number", "graphColoring"]);
                (GraphState.state.graphColoring as {}) = a.colors;

                const colors = help.flatten(a.colors);
                let p = help.stringReplacement(languages.current.NumberOfVertices, colors.length + "");
                p += "\n" + help.stringReplacement(languages.current.ChromaticNumberIs, a.chromaticNumber + "");
                p += "\n\n";

                colors.forEach((v, i) => {
                    p += help.stringReplacement(languages.current.VertexGetsColor, GraphState.nodeIDToLabel(i), v + "") + "\n";
                });

                p += `\n${JSON.stringify(help.rotate(a.colors), null, 4)}\n\n`;

                p = `<h3>${languages.current.GraphColoringTitle}</h3><hr>${help.htmlEncode(p)}`;
                p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;

                help.printout(p);
                window.main.applyColors();
            };

            const iStartedProgress = UIInteractions.startLoadingAnimation();

            if (!(a.chromaticNumber !== null && (await GraphState.getProperty("graphColoring")) !== null)) {
                const w = UIInteractions.getWorkerIfPossible(e => {
                    a = e.data;
                    printGC();
                    w.cleanup();
                    if (iStartedProgress) {
                        UIInteractions.stopLoadingAnimation();
                    }
                    UIInteractions.isRunning[myName] = false;
                    resolve(e.data);
                });
                w.send({
                    type: "colorNetwork",
                    args: [],
                    graph: window.main.graphState.getGraphData(),
                    convertToGraphImmut: true
                });
            } else {
                printGC();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
            }
        });
    }

    static makeAndPrintDirectionalEulerian(): Promise<void> {
        const myName = languages.current.Eulerian;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (!window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.eulerian = e.data;
                GraphState.setUpToDate(true, ["eulerian"]);
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve(e.data);
            });

            const scc = await GraphState.getProperty("stronglyConnectedComponents", true);

            w.send({
                type: "directionalEulerian",
                args: [gHelp.findVertexDegreesDirectional(GraphState.graph.getFullAdjacency()), scc]
            });
        });
    }

    static makeAndPrintEulerian(ignoreDuplicate = false): Promise<void> {
        const myName = languages.current.Eulerian;
        if (UIInteractions.isRunning[myName]) {
            if (ignoreDuplicate) {
                return Promise.resolve();
            }
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve(UIInteractions.makeAndPrintDirectionalEulerian());
            }

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const cc = await GraphState.getProperty("connectedComponents", true);

            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.eulerian = e.data;
                GraphState.setUpToDate(true, ["eulerian"]);
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                w.cleanup();
                resolve(e.data);
            });
            w.send({
                type: "hasEulerianCircuit",
                args: [GraphState.graph.getAllOutDegrees(), cc]
            });
        });
    }

    static makeAndPrintFFMCMF(): void {
        if (!window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }
        const myName = languages.current.FordFulkerson;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        help.showFormModal(
            async ($modal, values) => {
                $modal.modal("hide");

                const source = GraphState.nodeLabelToID(values[0]);
                const sink = GraphState.nodeLabelToID(values[1]);

                let a: boolean | FlowResult | null = null;

                const cb = () => {
                    let p = `<h3>${languages.current.FordFulkerson}</h3><hr>${help.stringReplacement(languages.current.NoPathFromAToB,
                        help.htmlEncode(GraphState.nodeIDToLabel(source)), help.htmlEncode(GraphState.nodeIDToLabel(sink)))}`;

                    if (a === false) {
                        help.printout(p);
                        return;
                    }
                    a = a as { maxFlow: number; flowPath: any[] };

                    p = `${languages.current.FordFulkersonMaxFlowMinCut} ${help.stringReplacement(languages.current.MaxFlowFromAToB,
                        GraphState.nodeIDToLabel(source), GraphState.nodeIDToLabel(sink), a.maxFlow + "")}`;
                    p += `\n\n${languages.current.UsingCapacities}\n\n`;
                    p = help.htmlEncode(p);
                    a.flowPath.forEach(v => {
                        p += help.stringReplacement(languages.current.FlowWithCapacity, GraphState.nodeIDToLabel(v.from),
                            GraphState.nodeIDToLabel(v.to), v.flow + "", v.capacity + "");
                        p += "\n";
                    });
                    p = p.trim();
                    p = `<h3>${languages.current.FordFulkersonMaxFlowMinCut}</h3><hr>` + p;

                    help.printout(p);
                };

                const iStartedProgress = UIInteractions.startLoadingAnimation();
                const w = UIInteractions.getWorkerIfPossible(e => {
                    a = e.data;
                    UIInteractions.isRunning[myName] = false;
                    cb();
                    if (iStartedProgress) {
                        UIInteractions.stopLoadingAnimation();
                    }
                    w.cleanup();
                });
                w.send({
                    type: "fordFulkerson",
                    args: [source, sink],
                    convertToGraphImmut: true,
                    graph: window.main.graphState.getGraphData()
                });
            },
            languages.current.FordFulkersonMaxFlowMinCut,
            languages.current.Go,
            languages.current.Cancel,
            [
                {
                    label: languages.current.SourceNode,
                    type: "text",
                    validationFunc: window.main.nodeLabelIDValidator
                },
                {
                    label: languages.current.SinkNode,
                    type: "text",
                    validationFunc: window.main.nodeLabelIDValidator
                }
            ],
            ($modal) => {
                UIInteractions.isRunning[myName] = false;
                $modal.modal("hide");
            }
        );
    }

    static makeAndPrintKruskal(): void {
        if (window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }

        const myName = languages.current.KruskalMST;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        const iStartedProgress = UIInteractions.startLoadingAnimation();
        const w = UIInteractions.getWorkerIfPossible(e => {
            const a: MSTResult = e.data;
            w.cleanup();

            let p = help.stringReplacement(languages.current.KruskalMSTTotalWeight, a.totalWeight + "");
            p += `\n\n${languages.current.UsingEdges}\n\n`;
            p = help.htmlEncode(p);
            a.mst.forEach(v => {
                p += `${GraphState.nodeIDToLabel(new EdgeImmut(v).getFrom())}&rarr;`;
                p += `${GraphState.nodeIDToLabel(new EdgeImmut(v).getTo())}\n`;
            });
            p = p.trim();
            p = `<h3>${languages.current.KruskalMST}</h3><hr>${p}`;

            if (iStartedProgress) {
                UIInteractions.stopLoadingAnimation();
            }
            UIInteractions.isRunning[myName] = false;

            help.printout(p);
        });
        w.send({
            type: "kruskal",
            args: [],
            convertToGraphImmut: true,
            graph: window.main.graphState.getGraphData()
        });
    }

    static makeAndPrintIsCyclic(): Promise<void> {
        if (!window.settings.getOption("direction")) {
            return Promise.resolve();
        }

        const myName = languages.current.Cyclic;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(resolve => {
            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.cyclic = e.data;
                GraphState.setUpToDate(true, ["cyclic"]);
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve();
            });
            w.send({
                type: "isGraphCyclic",
                args: [],
                convertToGraphImmut: true,
                graph: window.main.graphState.getGraphData()
            });
        });
    }

    static makeAndPrintTopologicalSort(): void {
        if (!window.settings.getOption("direction")) {
            return;
        }

        const myName = languages.current.TopoSort;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        const iStartedProgress = UIInteractions.startLoadingAnimation();
        const w = UIInteractions.getWorkerIfPossible(e => {
            const a: boolean | NodeImmut[] = e.data;
            w.cleanup();

            if (iStartedProgress) {
                UIInteractions.stopLoadingAnimation();
            }
            UIInteractions.isRunning[myName] = false;

            if (a === true) {
                GraphState.graphProperties.cyclic = true;
                GraphState.setUpToDate(true, ["cyclic"]);
                help.printout(languages.current.TopoSortErrorHTML);
                return;
            }

            let p = languages.current.TopoSort + ":\n\n";
            p = help.htmlEncode(p);
            (a as any[]).forEach(v => {
                p += `${GraphState.nodeIDToLabel(v.id)}, `;
            });
            p = p.slice(0, -2);
            p = `<h3>${languages.current.TopoSort}</h3><hr>${p}`;

            help.printout(p);
        });
        w.send({
            type: "topologicalSort",
            args: [],
            convertToGraphImmut: true,
            graph: window.main.graphState.getGraphData()
        });
    }

    static printGraphAlgorithms(): void {
        const $div = document.getElementById("algorithms-pane")!;
        $div.innerHTML = "";
        const directional = window.settings.getOption("direction");
        const weighted = window.settings.getOption("weights");

        const addAlgoToPane = (alg: AlgorithmI) => {
            const navlink = document.createElement("a");
            navlink.classList.add("nav-link");
            navlink.setAttribute("href", "#");
            navlink.innerText = alg.name;
            navlink.addEventListener("click", e => {
                e.preventDefault();
                alg.applyFunc();
            });

            $div.appendChild(navlink);
        };

        const a = UIInteractions.getAlgorithms();
        a.forEach(alg => {
            if (!alg.display) {
                return;
            }
            if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                    addAlgoToPane(alg);
                }
            } else if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                    addAlgoToPane(alg);
                }
            }
        });
    }
}
