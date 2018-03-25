"use strict";

import genericH from "./genericHelpers";

let SpanningTree = function (V) {
    this.id = [];
    for (let v = 0; v < V; v++) {
        this.id.push(v);
    }
};

SpanningTree.prototype = {
    constructor: SpanningTree,
    union: function (v, w) {
        let q = this.root(v);
        let p = this.root(w);

        if (p !== q) {
            this.id[p] = q;
        }
    },

    root: function (q) {
        while (this.id[q] !== q) {
            q = this.id[q];
        }
        return q;
    },

    connected: function (v, w) {
        return this.root(v) === this.root(w);
    }
};

export default genericH.deepFreeze(SpanningTree);
