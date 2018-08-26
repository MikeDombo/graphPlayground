"use strict";

export interface EdgeImmutPlain {
    label?: string;
    from: number;
    to: number;
    weight: number
    [key: string]: any;
    [key: number]: any
}

export default class EdgeImmut {
    private readonly from: Readonly<number>;
    private readonly to: Readonly<number>;
    private readonly weight: Readonly<number>;
    private readonly attributes: any;

    constructor(from: number | EdgeImmutPlain, to?: number, weight: any = 1, extraAttrs: any = null) {
        if(typeof from === "object"){
            to = from.to;
            weight = from.weight;
            from = from.from;
        }

        this.attributes = {};
        if (extraAttrs !== null && typeof extraAttrs === "object") {
            Object.keys(extraAttrs).forEach((key) => {
                this.attributes[key] = Object.freeze(extraAttrs[key]);
            });
        }

        this.attributes = Object.freeze(this.attributes);
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
        const toReturn: EdgeImmutPlain = {from: this.from, to: this.to, weight: this.weight};
        Object.keys(this.attributes).forEach((key) => {
            if (!(key in toReturn)) {
                toReturn[key] = this.attributes[key];
            }
        });

        return toReturn;
    }

    editEdge(newWeight: number, extraAttrs: any = {}): EdgeImmut {
        // Merge existing and new attributes favoring the new
        const attributes = Object.assign({}, this.attributes);
        Object.keys(extraAttrs).forEach((key) => {
            attributes[key] = extraAttrs[key];
        });

        return new EdgeImmut(this.getFrom(), this.getTo(),
            newWeight === null ? this.getWeight() : newWeight, attributes);
    }
}
