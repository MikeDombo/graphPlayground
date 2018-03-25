"use strict";

export default class EdgeImmut {
    constructor (from, to, weight = 1) {
        this.from = Object.freeze(from);
        this.to = Object.freeze(to);
        this.weight = Object.freeze(parseFloat(weight));

        if (new.target === EdgeImmut) {
            Object.freeze(this);
        }
    }

    getFrom () {
        return this.from;
    }

    getTo () {
        return this.to;
    }

    getWeight () {
        return this.weight;
    }

    toPlain () {
        return {from: this.from, to: this.to, weight: this.weight};
    }

    editEdge (newWeight) {
        return new EdgeImmut(this.getFrom(), this.getTo(), newWeight);
    }
}
