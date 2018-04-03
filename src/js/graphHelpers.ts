"use strict";

import {EdgeImmutPlain} from "./GraphImmut/EdgeImmut";
import {NodeImmutPlain} from "./GraphImmut/NodeImmut";

export default {
    findVertexDegreesDirectional: (adjacencyMatrix: Array<Array<number>>): Array<{ in: number; out: number; }> => {
        // Adjacency stores IDs of edges TO
        const degrees = [];
        adjacencyMatrix.forEach((v, i) => {
            if (i in degrees) {
                degrees[i].out += v.length;
            }
            else {
                degrees[i] = {out: v.length, in: 0};
            }
            v.forEach((outV) => {
                if (outV in degrees) {
                    degrees[outV].in += 1;
                }
                else {
                    degrees[outV] = {in: 1, out: 0};
                }
            });
        });

        return degrees;
    },

    interpolateNodesFromEdges: (edges: EdgeImmutPlain[]): Array<NodeImmutPlain> => {
        const nodes = [];
        edges.forEach((v) => {
            nodes[v.from] = {id: v.from, label: "" + v.from};
            nodes[v.to] = {id: v.to, label: "" + v.to};
        });

        return nodes;
    },
};
