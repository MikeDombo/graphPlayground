"use strict";

import help from './util/genericHelpers';
import GraphImmut from './classes/GraphImmut/GraphImmut';
import { EdgeImmutPlain } from "./classes/GraphImmut/EdgeImmut";
import { NodeImmutPlain } from "./classes/GraphImmut/NodeImmut";
import GraphState from "./graphState";
import { GraphPlain } from "./util/predefinedGraphs";
import * as languages from "./languages";

const exportedTextSelector = "exportedText";

const self = {
    importByString: (string: string, format: string): void => {
        if (format.toLowerCase() === "json") {
            try {
                const n = JSON.parse(string);
                if ("nodes" in n && "edges" in n) {
                    window.network.setData({}); // Clear out the existing network in order to import the proper
                    // locations
                    window.main.setData(n, false, true, false);
                }
                else {
                    help.showSimpleModal(languages.current.DataImportError,
                        `<p>${languages.current.DataImportErrorText}</p>`);
                }
            }
            catch (err) {
                help.showSimpleModal(languages.current.JsonParseError, `<p>${languages.current.JsonParseErrorText}</p><pre>${err}</pre>`);
            }
        }
        else if (format.toLowerCase() === "dimacs") {
            const lines = string.split(/\r?\n/);
            let graph: GraphImmut | null = null;
            let error = false;
            lines.forEach((l) => {
                const vals = l.split(/\s+/);
                if (vals[0].toLowerCase() === "p") {
                    if (vals[1].toLowerCase() !== "edge") {
                        help.showSimpleModal(languages.current.DimacsParseError,
                            `<p>${help.htmlEncode(languages.current.DimacsParseErrorText)}</p>`);
                        error = true;
                        return;
                    }
                    graph = new GraphImmut(parseInt(vals[2]));
                }
                else if (vals[0].toLowerCase() === "e" && graph !== null) {
                    graph = graph.addEdge(parseInt(vals[1]) - 1, parseInt(vals[2]) - 1);
                }
            });

            if (graph === null && !error) {
                help.showSimpleModal(languages.current.DimacsParseError, `<p>${languages.current.DimacsParseErrorNoProgram}</p>`);
                error = true;
            }

            if (!error) {
                const d: GraphPlain = GraphState.getGraphData(graph!);
                d.nodes.forEach((v) => {
                    v.label = v.id.toString();
                });
                window.main.setData(d, false, true, true);
            }
        }
        else {
            help.showSimpleModal(languages.current.UnrecognizedInputError, `<p>${languages.current.UnrecognizedInputError}.</p>`);
        }
    },

    makeImportTextModal: (): void => {
        help.showFormModal(($modal, values) => {
            $modal.modal("hide");
            self.importByString(values[0], values[1]);
        }, languages.current.ImportGraphFromText, languages.current.Import,
            [{ type: "textarea", label: languages.current.ImportText, extraAttrs: { style: "height: 20vh; min-height:400px;" } },
            { type: "select", label: languages.current.Format, optionValues: ["json", "dimacs"], optionText: ["JSON", "DIMACS"] }
            ]);
    },

    makeImportFileModal: (): void => {
        help.showFormModal(($modal, values) => {
            $modal.modal("hide");

            const files = values[0];
            if (files.length === 1) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = function (event: any) {
                    self.importByString(event.target.result, help.getFileExtension(file.name));
                };

                reader.readAsText(file);
            }
        }, languages.current.ImportGraphFromFile, languages.current.Import,
            [{
                type: "file", label: languages.current.UploadFile, validationFunc: (val, $files) => {
                    const files = ($files.get(0) as any).files;
                    if (files.length >= 1) {
                        return true;
                    }
                    return languages.current.MustChooseFileError;
                }
            }]);
    },

    makeExportFileModal: (): void => {
        help.showFormModal(null, languages.current.ExportGraphToFile, null,
            [{
                type: "button",
                initialValue: languages.current.ExportToJson,
                onclick: () => {
                    self.exportToFile("json");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary m-1"

                },
                clickDismiss: true
            },
            {
                type: "button",
                initialValue: languages.current.ExportToDimacs,
                onclick: () => {
                    self.exportToFile("dimacs");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary"
                },
                clickDismiss: true
            }
            ], null, false);
    },

    makeExportTextModal: (): void => {
        help.showFormModal(null, languages.current.ExportGraphToText, null,
            [{
                type: "button",
                initialValue: languages.current.ExportToJson,
                onclick: () => {
                    self.exportToText("json");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary m-1",
                },
                clickDismiss: false
            },
            {
                type: "button",
                initialValue: languages.current.ExportToDimacs,
                onclick: () => {
                    self.exportToText("dimacs");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary",
                },
                clickDismiss: false
            },
            {
                type: "textarea", label: "", initialValue: "", extraAttrs: {
                    style: "height: 20vh;" +
                        " min-height:400px; white-space:pre; margin-top: 1rem;"
                },
                onclick: () => {
                    (document.getElementById(exportedTextSelector) as HTMLTextAreaElement).select();
                    document.execCommand("copy");
                }, id: "exportedText"
            }
            ], ($modal) => {
                $modal.modal("hide");
            }, false);
    },

    exportToFile: (format: string): void => {
        if (format.toLowerCase() === "json") {
            self.downloadFile("graph.json", self.getDataAsJSON());
        }
        else if (format.toLowerCase() === "dimacs") {
            self.downloadFile("graph.dimacs", self.getDataAsDIMACS());
        }
    },

    exportToText: (format: string): void => {
        if (format.toLowerCase() === "json") {
            document.getElementById(exportedTextSelector)!.innerHTML = JSON.stringify(JSON.parse(self.getDataAsJSON()), null, 2);
        }
        else if (format.toLowerCase() === "dimacs") {
            document.getElementById(exportedTextSelector)!.innerHTML = self.getDataAsDIMACS();
        }
    },

    getDataAsJSON: (): string => {
        const d = GraphState.getGraphData(GraphState.graph);
        const nodeKeys = ["id", "label", "color", "x", "y"];
        const edgeKeys = ["from", "to", "weight", "color"];
        d.nodes = help.keepOnlyKeys(d.nodes, nodeKeys) as NodeImmutPlain[];
        d.edges = help.keepOnlyKeys(d.edges, edgeKeys) as EdgeImmutPlain[];

        return JSON.stringify(d);
    },

    getDataAsDIMACS: (): string => {
        // If I add direction, DIMACS cannot be used, it only works for undirected graphs
        const g = GraphState.getGraphData();
        let text = "c This Graph was generated and exported from Michael Dombrowski's Graph Playground " +
            "-- https://mikedombo.github.io/graphPlayground -- https://mikedombrowski.com\n";

        let adj = GraphState.graph.getFullAdjacency();
        adj = adj.filter((v: number[]) => {
            return v.length !== 0;
        });

        const nodes: number[] = [];
        adj.forEach((v: number[], i: number) => {
            if (nodes.indexOf(i + 1) === -1) {
                nodes.push(i + 1);
            }
            v.forEach((n: number) => {
                if (nodes.indexOf(n + 1) === -1) {
                    nodes.push(n + 1);
                }
            });
        });

        let edgeCount = 0;
        let edgeText = "";
        g.edges.forEach((v: EdgeImmutPlain) => {
            edgeText += `e ${v.from + 1} ${v.to + 1}\n`;
            edgeCount++;
        });
        edgeText = edgeText.trim();

        text += `p edge ${nodes.length} ${edgeCount}\n`;
        return text + edgeText;
    },

    downloadFile: (filename: string, text: string): void => {
        const blob = new Blob([text], { type: 'text/plain' });
        // @ts-ignore
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            const a = window.document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blob as any);
        }
    },
};

export default self;
