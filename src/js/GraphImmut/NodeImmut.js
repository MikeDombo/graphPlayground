"use strict";

export default class NodeImmut {
	constructor (id, label = null, extraAttrs = null) {
		this.id = id;

		if (label === null) {
			this.label = id.toString();
		}
		else {
			this.label = label;
		}

		this.attributes = {};
		if (extraAttrs !== null && typeof extraAttrs === "object") {
			Object.keys(extraAttrs).forEach((key) => {
				this.attributes[key] = Object.freeze(extraAttrs[key]);
			});
		}

		this.attributes = Object.freeze(this.attributes);
		this.label = Object.freeze(this.label);
		this.id = Object.freeze(this.id);

		if(new.target === NodeImmut){
			Object.freeze(this);
		}
	}

	toPlain () {
		let toReturn = {id: this.id, label: this.label};
		Object.keys(this.attributes).forEach((key) => {
			if (!(key in toReturn)) {
				toReturn[key] = this.attributes[key];
			}
		});

		return toReturn;
	}

	getID () {
		return this.id;
	}

	getLabel () {
		return this.label;
	}

	getAttribute (attribute) {
		if (attribute in this.attributes) {
			return this.attributes[attribute];
		}

		return null;
	}

	getAllAttributes () {
		return this.attributes;
	}

	editNode (label = null, extraAttrs = null) {
		if (label === null) {
			label = this.getLabel();
		}

		// Merge existing and new attributes favoring the new
		let attributes = Object.assign({}, this.attributes);
		Object.keys(extraAttrs).forEach((key) => {
			attributes[key] = extraAttrs[key];
		});

		return new NodeImmut(this.getID(), label, attributes);
	}
}
