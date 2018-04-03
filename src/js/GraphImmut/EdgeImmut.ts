"use strict";

export interface EdgeImmutPlain {
    label?: string;
    from: number;
    to: number;
    weight: number
}

export default class EdgeImmut {
    private readonly from: Readonly<number>;
    private readonly to: Readonly<number>;
    private readonly weight: Readonly<number>;

    constructor(from: number, to: number, weight: any = 1) {
        this.from = Object.freeze(from);
        this.to = Object.freeze(to);
        this.weight = Object.freeze(parseFloat(weight));

        if (new.target === EdgeImmut) {
            Object.freeze(this);
        }
    }

    getFrom(): Readonly<number> {
        return this.from;
    }

    getTo(): Readonly<number> {
        return this.to;
    }

    getWeight(): Readonly<number> {
        return this.weight;
    }

    toPlain(): { from: Readonly<number>; to: Readonly<number>; weight: Readonly<number> } {
        return {from: this.from, to: this.to, weight: this.weight};
    }

    editEdge(newWeight: number): EdgeImmut {
        return new EdgeImmut(this.getFrom(), this.getTo(), newWeight);
    }
}
