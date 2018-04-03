"use strict";

export default class SpanningTree {
    private readonly id: number[];

    constructor(V: number) {
        this.id = [];
        for (let v = 0; v < V; v++) {
            this.id.push(v);
        }
    }

    union(v: number, w: number) {
        const q = this.root(v);
        const p = this.root(w);

        if (p !== q) {
            this.id[p] = q;
        }
    }

    root(q: number) {
        while (this.id[q] !== q) {
            q = this.id[q];
        }
        return q;
    }

    connected(v: number, w: number) {
        return this.root(v) === this.root(w);
    }
}
