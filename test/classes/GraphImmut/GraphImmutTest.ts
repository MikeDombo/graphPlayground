import {expect} from 'chai';
import 'mocha';
import GraphImmut from '../../../src/js/classes/GraphImmut/GraphImmut';
import EdgeImmut, {EdgeImmutPlain} from "../../../src/js/classes/GraphImmut/EdgeImmut";
import NodeImmut, {NodeImmutPlain} from "../../../src/js/classes/GraphImmut/NodeImmut";

describe('Constructor', () => {
    it('Should construct with defaults', () => {
        const graph = new GraphImmut(0, null, false, false);
        expect(graph).to.be.a('object')
            .and.to.be.instanceOf(GraphImmut)
            .and.to.be.frozen;
        expect(graph.getNumberOfNodes()).to.equal(0);
        expect(graph.getNumberOfEdges()).to.equal(0);
        expect(graph.isDirected()).to.be.false;
        expect(graph.isWeighted()).to.be.false;
    });
    it('Should construct with some number of nodes', () => {
        const graph = new GraphImmut(10, null, false, false);
        expect(graph).to.be.a('object')
            .and.to.be.instanceOf(GraphImmut)
            .and.to.be.frozen;
        expect(graph.getNumberOfNodes()).to.equal(10);
        expect(graph.getAllNodesAsImmutableList().size).to.equal(10);
        expect(graph.getNumberOfEdges()).to.equal(0);
        expect(graph.isDirected()).to.be.false;
        expect(graph.isWeighted()).to.be.false;
    });
    it('Should construct with some number of nodes and edges', () => {
        const graph = new GraphImmut(10,
            [{from: 0, to: 0, weight: 1}, {from: 0, to: 1, weight: 1}, {from: 3, to: 9, weight: 1}],
            false, false);

        expect(graph).to.be.a('object')
            .and.to.be.instanceOf(GraphImmut)
            .and.to.be.frozen;
        expect(graph.getNumberOfNodes()).to.equal(10);
        expect(graph.getAllNodesAsImmutableList().size).to.equal(10);
        expect(graph.getNumberOfEdges()).to.equal(3);
        expect(graph.getEdgesBetween(0, 1)).to.have.lengthOf(1);
        expect(graph.isDirected()).to.be.false;
        expect(graph.isWeighted()).to.be.false;
    });
    it('Should construct with plain node list with non-normalized IDs', () => {
        const graph = new GraphImmut([{id: 1, label: '1'}, {id: 3, label: '3'}, {id: 6, label: 'different'}],
            null, false, false);

        expect(graph).to.be.a('object')
            .and.to.be.instanceOf(GraphImmut)
            .and.to.be.frozen;
        expect(graph.getAllNodes()).to.have.lengthOf(3)
            .and.deep.equal([{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: 'different'}]);
        expect(graph.getNumberOfEdges()).to.equal(0);
    });
    it('Should construct with plain node list with non-normalized IDs and edges', () => {
        const graph = new GraphImmut([{id: 1, label: '1'}, {id: 3, label: '3'}, {id: 6, label: 'different'}],
            [{from: 1, to: 6, weight: 1}, {from: 6, to: 3, weight: 1}], false, false);

        expect(graph).to.be.a('object')
            .and.to.be.instanceOf(GraphImmut)
            .and.to.be.frozen;
        expect(graph.getAllNodes()).to.have.lengthOf(3)
            .and.deep.equal([{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: 'different'}]);
        expect(graph.getNumberOfEdges()).to.equal(2);
        expect(graph.getEdgesBetween(0, 2)).to.have.lengthOf(1);
        expect(graph.getEdgesBetween(0, 3)).to.have.lengthOf(0);
    });
});

describe('Get Methods', () => {
    const graph = new GraphImmut([{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: 'different'}],
        [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1}], false, false);

    it('Should get counts', () => {
        expect(graph.getNumberOfEdges()).to.equal(2);
        expect(graph.getNumberOfNodes()).to.equal(3);
    });

    it('Should get edges between nodes', () => {
        expect(graph.getEdgesBetween(0, 2)).to.have.lengthOf(1);
        expect(graph.getEdgesBetween(0, 2)[0]).to.be.instanceOf(EdgeImmut);
        expect(graph.getEdgesBetween(0, 2)[0].toPlain()).to.deep.equal({from: 0, to: 2, weight: 1});

        expect(graph.getEdgesBetween(0, 3)).to.have.lengthOf(0);
        expect(graph.getEdgesBetween(0, 300)).to.have.lengthOf(0);
    });

    it('Should get node', () => {
        expect(graph.getNode(0)).to.not.be.null;
        expect(graph.getNode(100)).to.be.false;
        expect((<NodeImmutPlain>graph.getNode(0))).to.deep.equal({id: 0, label: '0'});
        expect((<NodeImmut>graph.getNode(0, true)).toPlain()).deep.equal({id: 0, label: '0'});
    });

    it('Should get node out-degrees', () => {
        expect(graph.getAllOutDegrees()).to.deep.equal([1, 1, 0]);
        const graph2 = new GraphImmut([{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: 'different'}],
            [{from: 0, to: 2, weight: 1}, {from: 2, to: 1, weight: 1}], false, false);
        expect(graph2.getAllOutDegrees()).to.deep.equal([1, 0, 1]);
        const graph3 = new GraphImmut([{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: 'different'}],
            [{from: 0, to: 2, weight: 1}, {from: 0, to: 1, weight: 1}, {from: 2, to: 1, weight: 1}], false, false);
        expect(graph3.getAllOutDegrees()).to.deep.equal([2, 0, 1]);
    });

    it('Should get node adjacency', () => {
        const diGraph = graph.asDirected();
        expect(graph.getNodeAdjacency(0)).to.have.lengthOf(1);
        expect(graph.getNodeAdjacency(1)).to.have.lengthOf(1);
        expect(graph.getNodeAdjacency(2)).to.have.lengthOf(2);
        expect(diGraph.getNodeAdjacency(0)).to.have.lengthOf(1);
        expect(diGraph.getNodeAdjacency(1)).to.have.lengthOf(1);
        expect(diGraph.getNodeAdjacency(2)).to.have.lengthOf(0);
    });

    it('Should get full adjacency', () => {
        const diGraph = graph.asDirected();
        expect(graph.getFullAdjacency()).to.deep.equal([[2], [2], [0, 1]]);
        expect(diGraph.getFullAdjacency()).to.deep.equal([[2], [2], []]);
    });

    it('Should check adjacency', () => {
        const diGraph = graph.asDirected();
        expect(graph.areAdjacent(0, 1)).to.be.false;
        expect(graph.areAdjacent(0, 2)).to.be.true;
        expect(graph.areAdjacent(2, 1)).to.be.true;

        expect(diGraph.areAdjacent(0, 1)).to.be.false;
        expect(diGraph.areAdjacent(0, 2)).to.be.true;
        expect(diGraph.areAdjacent(2, 1)).to.be.false;
    });

    it('Should get min-weight edge', () => {
        const graph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 0, to: 2, weight: 5}], false, true);
        expect(graph.getMinWeightEdgeBetween(0, 2)).to.equal(1);
        expect(graph.getMinWeightEdgeBetween(1, 2)).to.equal(1);
        expect(graph.getMinWeightEdgeBetween(0, 1)).to.equal(Infinity);
    });

});

describe('Graph Conversions', () => {

    it('Should reduce a multigraph', () => {
        const diGraph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 0, to: 2, weight: 5}], true, true);
        let reduced = diGraph.reduceMultiGraph(Math.min);
        expect(reduced.getNumberOfEdges()).to.equal(2);
        expect(reduced.getAllEdges()).to.have.deep.members([{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1}]);

        const graph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 0, to: 2, weight: 5}], false, true);
        reduced = graph.reduceMultiGraph(Math.min);
        expect(reduced.getNumberOfEdges()).to.equal(4);
        expect(reduced.getAllEdges()).to.have.deep.members([{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
            {from: 2, to: 0, weight: 1}, {from: 2, to: 1, weight: 1}]);
    });

    it('Should convert to directed', () => {
        const weightedGraph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 2, to: 1, weight: 1}, {from: 0, to: 2, weight: 5}], false, false);
        const weightedDiGraphSingleEdges = weightedGraph.asDirected();
        const weightedDiGraphDoubleEdges = weightedGraph.asDirected(true);

        expect(weightedDiGraphSingleEdges.isDirected()).to.be.true;
        expect(weightedDiGraphDoubleEdges.isDirected()).to.be.true;

        expect(weightedDiGraphSingleEdges.getNumberOfEdges()).to.equal(4);
        expect(weightedDiGraphDoubleEdges.getNumberOfEdges()).to.equal(8);
    });

    it('Should convert to undirected', () => {
        const diGraph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 2, to: 1, weight: 1}, {from: 0, to: 2, weight: 5}],
            true, false);
        const graph = diGraph.asUndirected();

        expect(graph.isDirected()).to.be.false;
        expect(graph.getNumberOfEdges()).to.equal(2);
        expect((<EdgeImmutPlain[]> graph.getAllEdges()))
            .to.have.deep.members([{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1}]);
    });

    it('Should convert to weighted', () => {
        const graph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 2, to: 1, weight: 1}, {from: 0, to: 2, weight: 5}], false, false);
        const weightedGraph = graph.asWeighted();

        expect(weightedGraph.isWeighted()).to.be.true;
        expect((<EdgeImmut[]> weightedGraph.getAllEdges(true)).map((edge) => edge.getWeight()))
            .deep.members([1, 1, 1, 1]);
    });

    it('Should convert to unweighted', () => {
        const weightedGraph = new GraphImmut(3,
            [{from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1},
                {from: 2, to: 1, weight: 1}, {from: 0, to: 2, weight: 5}], false, true);
        const unWeighted = weightedGraph.asUnweighted();

        expect(unWeighted.isWeighted()).to.be.false;
        expect((<EdgeImmut[]> weightedGraph.getAllEdges(true)).map((edge) => edge.getWeight()))
            .deep.members([1, 1, 1, 5]);
    });

    it('Should convert between any', () => {
        const nothingGraph = new GraphImmut(0, null, false, false);
        expect(nothingGraph.asChangedDirectedWeighted(true, true).isWeighted()).to.be.true;
        expect(nothingGraph.asChangedDirectedWeighted(true, true).isDirected()).to.be.true;
        expect(nothingGraph.asChangedDirectedWeighted(true, false).isWeighted()).to.be.false;
        expect(nothingGraph.asChangedDirectedWeighted(true, false).isDirected()).to.be.true;
        expect(nothingGraph.asChangedDirectedWeighted(false, true).isWeighted()).to.be.true;
        expect(nothingGraph.asChangedDirectedWeighted(false, true).isDirected()).to.be.false;

        const diGraph = new GraphImmut(0, null, true, false);
        expect(diGraph.asChangedDirectedWeighted(true, true).isWeighted()).to.be.true;
        expect(diGraph.asChangedDirectedWeighted(true, true).isDirected()).to.be.true;
        expect(diGraph.asChangedDirectedWeighted(true, false).isWeighted()).to.be.false;
        expect(diGraph.asChangedDirectedWeighted(true, false).isDirected()).to.be.true;
        expect(diGraph.asChangedDirectedWeighted(false, true).isWeighted()).to.be.true;
        expect(diGraph.asChangedDirectedWeighted(false, true).isDirected()).to.be.false;

        const weightedGraph = new GraphImmut(0, null, true, true);
        expect(weightedGraph.asChangedDirectedWeighted(true, true).isWeighted()).to.be.true;
        expect(weightedGraph.asChangedDirectedWeighted(true, true).isDirected()).to.be.true;
        expect(weightedGraph.asChangedDirectedWeighted(true, false).isWeighted()).to.be.false;
        expect(weightedGraph.asChangedDirectedWeighted(true, false).isDirected()).to.be.true;
        expect(weightedGraph.asChangedDirectedWeighted(false, true).isWeighted()).to.be.true;
        expect(weightedGraph.asChangedDirectedWeighted(false, true).isDirected()).to.be.false;
    });
});

describe('Graph Editing', () => {
    const emptyGraph = new GraphImmut(0, null, false, false);
    const filledGraph = new GraphImmut(10,
        [{from: 0, to: 2, weight: 1}, {from: 0, to: 2, weight: 1}, {from: 1, to: 2, weight: 1}],
        false, false);
    const filledGraphWeighted = new GraphImmut(10,
        [{from: 0, to: 2, weight: 1}, {from: 0, to: 2, weight: 5}, {from: 1, to: 2, weight: 1}],
        false, true);
    it('Should add a node', () => {
        const g1 = emptyGraph.addNode();
        expect(g1.getNumberOfNodes()).to.equal(1);
        expect(<NodeImmutPlain> g1.getNode(0)).to.deep.equal({id: 0, label: "0"});

        const g2 = emptyGraph.addNode({label: 'newNode'});
        expect(g2.getNumberOfNodes()).to.equal(1);
        expect(<NodeImmutPlain> g2.getNode(0)).to.deep.equal({id: 0, label: "newNode"});

        const g3 = emptyGraph.addNode({color: 'red'});
        expect(g3.getNumberOfNodes()).to.equal(1);
        expect(<NodeImmutPlain> g3.getNode(0)).to.deep.equal({id: 0, label: "0", color: 'red'});

        // Don't overwrite ID
        const g4 = emptyGraph.addNode({id: 10});
        expect(g4.getNumberOfNodes()).to.equal(1);
        expect(<NodeImmutPlain> g4.getNode(0)).to.deep.equal({id: 0, label: "0"});
    });

    it('Should add an edge', () => {
        const g1 = emptyGraph.addEdge(0, 0);
        expect(g1.getNumberOfEdges()).to.equal(1);

        const g2 = emptyGraph.addEdge(0, 0, 10);
        expect(g2.getNumberOfEdges()).to.equal(1);
        expect(g2.getAllEdges()).to.have.deep.members([{from: 0, to: 0, weight: 1}]);

        const g3 = new GraphImmut(0, null, false, true).addEdge(0, 0, 10);
        expect(g3.getNumberOfEdges()).to.equal(1);
        expect(g3.getAllEdges()).to.have.deep.members([{from: 0, to: 0, weight: 10}]);
    });

    it('Should edit a node', () => {
        const edited = filledGraph.editNode(0, {color: 'red'}) as GraphImmut;
        expect(edited.getNode(0)).to.deep.equal({id: 0, label: '0', color: 'red'});
        expect(filledGraph.editNode(500, {})).to.be.false;
    });

    it('Should edit an edge', () => {
        const e1 = filledGraph.editEdge(0, 2, 10) as GraphImmut;
        expect(e1.getEdgesBetween(0, 2)[0].getWeight()).equals(10);
        expect(e1.getEdgesBetween(0, 2)[1].getWeight()).equals(1);

        const e2 = filledGraph.editEdge(0, 2, 10, 1) as GraphImmut;
        expect(e2.getEdgesBetween(0, 2)[0].getWeight()).equals(10);
        expect(e2.getEdgesBetween(0, 2)[1].getWeight()).equals(1);

        const e3 = filledGraphWeighted.editEdge(0, 2, 10) as GraphImmut;
        expect(e3.getEdgesBetween(0, 2)[0].getWeight()).equals(10);
        expect(e3.getEdgesBetween(0, 2)[1].getWeight()).equals(5);

        const e4 = filledGraphWeighted.editEdge(0, 2, 10, 5) as GraphImmut;
        expect(e4.getEdgesBetween(0, 2)[0].getWeight()).equals(1);
        expect(e4.getEdgesBetween(0, 2)[1].getWeight()).equals(10);
    });

    it('Should delete a node', () => {
        const g = filledGraph.deleteNode(0) as GraphImmut;
        expect(g.getNumberOfNodes()).to.equal(9);
        expect(g.getNumberOfEdges()).to.equal(1);

        const g2 = filledGraph.deleteNode(3) as GraphImmut;
        expect(g2.getNumberOfNodes()).to.equal(9);
        expect(g2.getNumberOfEdges()).to.equal(3);
        expect((<NodeImmut[]>g2.getAllNodes(true)).map((node) => node.getID())).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8])
    });

    it('Should delete edges', () => {
        const g = filledGraph.deleteEdge(0, 2, null, true);
        expect(g.getNumberOfEdges()).to.equal(1);
        const g2 = filledGraph.deleteEdge(0, 2, null, false);
        expect(g2.getNumberOfEdges()).to.equal(2);
        const g3 = filledGraphWeighted.deleteEdge(0, 2, 5, false);
        expect(g3.getNumberOfEdges()).to.equal(2);
        expect(g3.getEdgesBetween(0, 2)[0].getWeight()).to.equal(1);
    });
});