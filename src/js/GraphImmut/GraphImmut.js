"use strict";

import {List} from "immutable";
import NodeImmut from './NodeImmut';
import EdgeImmut from './EdgeImmut';

const filterNodeExtraAttr = (data) => {
	return Object.keys(data)
	             .filter((key) => !(["label", "id"]).includes(key))
	             .reduce((obj, key) => {
		             obj[key] = data[key];
		             return obj;
	             }, {});
};

export default class GraphImmut {
	constructor (nodes, edges = null, directed = false, weighted = false) {
		this.nodes = new List();
		this.edges = new List();
		this.numEdges = 0;
		this.directed = Object.freeze(directed);
		this.weighted = Object.freeze(weighted);

		if (typeof nodes === "number") {
			this.numNodes = Object.freeze(nodes);
			// Create the nodes
			for (let i = 0; i < this.numNodes; i++) {
				this.nodes = this.nodes.set(i, new NodeImmut(i));
			}
		}
		else {
			let nodeNum = 0;
			nodes.forEach((n) => {
				let id = nodeNum++;
				let label = null;
				let extraAttrs = null;

				if (n instanceof NodeImmut) {
					id = n.getID();
					label = n.getLabel();
					extraAttrs = n.getAllAttributes();
				}
				else {
					if ("id" in n) {
						id = n.id;
					}
					if ("label" in n) {
						label = n.label;
					}
					if ("attributes" in n) {
						extraAttrs = filterNodeExtraAttr(n.attributes);
					}
					else {
						extraAttrs = filterNodeExtraAttr(n);
					}
				}

				this.nodes = this.nodes.set(n.id, new NodeImmut(id, label, extraAttrs));
			});

			this.numNodes = Object.freeze(nodeNum);
		}

		// If we are given edges, add them to the graph
		if (edges !== null) {
			this.numEdges = edges instanceof List ? edges.size : edges.length;

			edges.forEach((edge) => {
				let weight = 0;
				let from = 0;
				let to = 0;
				if (edge instanceof EdgeImmut) {
					weight = edge.getWeight();
					from = edge.getFrom();
					to = edge.getTo();
				}
				else {
					if ("weight" in edge && this.weighted) {
						weight = parseFloat(edge.weight);
					}
					if ("from" in edge) {
						from = edge.from;
					}
					if ("to" in edge) {
						to = edge.to;
					}
				}

				this.edges = this.edges.push(new EdgeImmut(from, to, weight));
			});
		}

		this.numEdges = Object.freeze(this.numEdges);

		if(new.target === GraphImmut){
			Object.freeze(this);
		}
	}

	clone () {
		return new GraphImmut(this.nodes, this.edges, this.directed, this.weighted);
	}

	getNode (id, rich = false) {
		if (rich) {
			return this.nodes.get(id);
		}
		return this.nodes.get(id).toPlain();
	}

	addNode (data = null) {
		if (data === null) {
			data = {};
		}

		data.id = this.numNodes;
		if (!("label" in data)) {
			data.label = data.id.toString();
		}

		let extraAttrs = filterNodeExtraAttr(data);

		return new GraphImmut(this.nodes.set(data.id, new NodeImmut(data.id, data.label, extraAttrs)),
			this.edges, this.directed, this.weighted);
	}

	editNode (id, data) {
		if (!this.nodes.has(id)) {
			return false;
		}

		let extraAttrs = filterNodeExtraAttr(data);
		if (!("label" in data)) {
			data.label = this.getNode(id, true).getLabel();
		}
		return new GraphImmut(this.nodes.set(id, this.getNode(id, true).editNode(data.label, extraAttrs)),
			this.edges, this.directed, this.weighted);
	}

	deleteNode (id) {
		// Make sure the ID exists
		if (!(id >= 0 && id < this.numNodes)) {
			return false;
		}

		let nodeMap = {}; // Map for old IDs to new ones since we're deleting an entry

		// Remove it from the node list
		let nodeCount = 0;
		let newNodes = this.nodes
		                   .filter((n) => {
			                   if (n.getID() === id) {
				                   nodeMap[n.getID()] = -1;
			                   }
			                   else {
				                   nodeMap[n.getID()] = nodeCount++;
			                   }

			                   return n.getID() !== id;
		                   })
		                   .map((node) => {
			                   let label = node.getLabel();
			                   if (node.getID().toString() === label) {
				                   label = nodeMap[node.getID()].toString();
			                   }

			                   return new NodeImmut(nodeMap[node.getID()], label, node.getAllAttributes());
		                   });

		// Remap edges
		let newEdges = this.edges
		                   .filter((edge) => {
			                   return !(edge.getFrom() === id || edge.getTo() === id);
		                   })
		                   .map((edge) => {
			                   return new EdgeImmut(nodeMap[edge.getFrom()], nodeMap[edge.getTo()], edge.getWeight());
		                   });

		return new GraphImmut(newNodes, newEdges, this.directed, this.weighted);
	}

	addEdge (from, to, weight = 1) {
		if (!this.weighted) {
			weight = 1; // Ensure that edge weights are 1 if this is an unweighted graph
		}

		let newEdges = this.edges.push(new EdgeImmut(from, to, parseFloat(weight)));
		return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
	}

	deleteEdge (from, to, weight = null, deleteAll = true) {
		if (weight !== null) {
			weight = parseFloat(weight);
		}

		let foundOneEdge = false;
		let newEdges = this.edges.filter((edge) => {
			// If we're not deleting everything and we have found one edge, then do not filter anymore
			if (foundOneEdge && !deleteAll) {
				return true;
			}

			// If we have an exact match
			if (edge.getFrom() === from && edge.getTo() === to && (weight === null || edge.getWeight() === weight)) {
				foundOneEdge = true;
				return false; // Remove this edge
			}

			// If we are undirected, check for opposing matches
			if (!this.directed) {
				if (edge.getFrom() === to && edge.getTo() === from && (weight === null || edge.getWeight() === weight)) {
					foundOneEdge = true;
					return false; // Remove this edge
				}
			}

			return true;
		});

		return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
	}

	editEdge (from, to, newWeight, oldWeight = null) {
		// Editing only makes sense for weighted graphs.
		// To change from/to, just delete the edge and add a new one
		if (!this.weighted) {
			return false;
		}

		let foundFirst = false;

		if (oldWeight !== null) {
			oldWeight = parseFloat(oldWeight);
		}

		let newEdges = this.edges;
		this.edges.forEach((edge, index) => {
			if (foundFirst) {
				return;
			}
			if (edge.getFrom() === from && edge.getTo() === to && (oldWeight === null || edge.getWeight() === oldWeight)) {
				newEdges = newEdges.set(index, edge.editEdge(parseFloat(newWeight)));
				foundFirst = true;
			}
		});

		return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
	}

	getAllNodes (rich = false) {
		if (rich) {
			return this.nodes.toArray();
		}
		return this.nodes.map((node) => {
			return node.toPlain();
		}).toArray();
	}

	getAllEdges (rich = false) {
		if (rich) {
			return this.edges.toArray();
		}
		return this.edges.map((edge) => {
			return edge.toPlain();
		}).toArray();
	}

	getNumberOfNodes () {
		return this.numNodes;
	}

	getNumberOfEdges () {
		return this.numEdges;
	}

	getAllOutDegrees () {
		let degrees = [];
		this.edges.forEach((edge) => {
			if (edge.getFrom() in degrees) {
				degrees[edge.getFrom()]++;
			}
			else {
				degrees[edge.getFrom()] = 1;
			}
		});

		return degrees;
	}

	convertToWeighted () {
		return new GraphImmut(this.nodes, this.edges.map((edge) => {
			return edge.editEdge(1);
		}), this.directed, true);
	}

	convertToUnWeighted () {
		return new GraphImmut(this.nodes, this.edges.map((edge) => {
			return edge.editEdge(1);
		}), this.directed, false);
	}

	convertToDirected (doubleEdges = false) {
		if (!doubleEdges) {
			return new GraphImmut(this.nodes, this.edges, true, this.weighted);
		}

		let newEdges = this.edges;
		this.edges.forEach((edge) => {
			newEdges = newEdges.push(new EdgeImmut(edge.getTo(), edge.getFrom(), edge.getWeight()));
		});

		return new GraphImmut(this.nodes, newEdges, true, this.weighted);
	}

	getGraphAsUndirected () {
		let newEdges = [];
		let addedEdges = {};

		this.edges.forEach((edge) => {
			let from = edge.getFrom();
			let to = edge.getTo();
			if (to > from) {
				from = to;
				to = edge.getFrom();
			}
			if (!(from + "_" + to in addedEdges)) {
				addedEdges[from + "_" + to] = null;
				newEdges.push(new EdgeImmut(from, to, edge.getWeight()));
			}
		});

		return new GraphImmut(this.nodes, newEdges, false, this.weighted);
	}

	getNodeAdjacency (id) {
		let adj = [];
		this.edges.forEach((edge) => {
			if (edge.getFrom() === id) {
				adj.push(edge.getTo());
			}
			else if (!this.directed && edge.getTo() === id) {
				adj.push(edge.getFrom());
			}
		});

		return adj;
	}

	getFullAdjacency () {
		let adj = [];
		this.nodes.forEach((n) => {
			adj[n.getID()] = this.getNodeAdjacency(n.getID());
		});

		return adj;
	}

	areAdjacent (id1, id2) {
		return this.getNodeAdjacency(id1).includes(id2);
	}

	getEdgesBetween (id1, id2) {
		let edgeList = [];
		this.edges.forEach((edge) => {
			if (!this.directed && edge.getFrom() === id2 && edge.getTo() === id1) {
				edgeList.push(edge);
			}

			if (edge.getFrom() === id1 && edge.getTo() === id2) {
				edgeList.push(edge);
			}
		});

		return edgeList;
	}

	getMinWeightEdgeBetween (id1, id2) {
		let minWeight = Infinity;
		this.getEdgesBetween(id1, id2).forEach((edge) => {
			if (edge.getWeight() < minWeight) {
				minWeight = edge.getWeight();
			}
		});

		return minWeight;
	}

	// Take a multigraph and reduce all multiple edges to a single edge, weighted using the reducer
	reduceMultiGraph (reducer, initialValue) {
		if (typeof initialValue === "undefined") {
			initialValue = 0;
		}

		let multiEdges = [];
		this.nodes.forEach((node) => {
			// If we have duplicates
			let adj = this.getNodeAdjacency(node.getID());
			let uniques = new Set(adj);
			if (uniques.size < adj.length) {
				uniques.forEach((to) => {
					let newWeight = this.getEdgesBetween(node.getID(), to).reduce((acc, edge) => {
						return reducer(acc, edge.getWeight());
					}, initialValue);

					multiEdges.push({from: node.getID(), to: to, weight: parseFloat(newWeight)});
				});
			}
		});

		// Remove all multigraph edges and replace them with single new edges
		let newEdges = this.edges.filter((edge) => {
			let keep = true;
			multiEdges.forEach((duplicateEdge) => {
				if (edge.getFrom() === duplicateEdge.from && edge.getTo() === duplicateEdge.to) {
					keep = false;
				}
			});

			return keep;
		});
		multiEdges.forEach((edge) => {
			newEdges = newEdges.push(new EdgeImmut(edge.from, edge.to, edge.weight));
		});

		return new GraphImmut(this.nodes, newEdges, this.directed, this.weighted);
	}

	isWeighted () {
		return this.weighted;
	}

	isDirected () {
		return this.directed;
	}
}
