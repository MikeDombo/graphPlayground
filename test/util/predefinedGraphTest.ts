import {expect} from 'chai';
import 'mocha';
import graphs from '../../src/js/util/predefinedGraphs';

describe('Test complete graph', () => {
    it('Should make a complete graph', () => {
        const complete0 = graphs._complete(0);
        const complete1 = graphs._complete(1);
        const comleteMany = graphs._complete(4);

        expect(complete0).to.deep.equal({nodes: [], edges: [], directed: false, weighted: false});
        expect(complete1).to.deep.equal({nodes: [{id: 0, label: '0'}], edges: [], directed: false, weighted: false});
        expect(comleteMany).to.deep.equal({
            nodes: [{id: 0, label: '0'}, {id: 1, label: '1'}, {id: 2, label: '2'}, {id: 3, label: '3'}],
            edges: [{"from": 0, "to": 1},
                {"from": 0, "to": 2},
                {"from": 0, "to": 3},
                {"from": 1, "to": 2},
                {"from": 1, "to": 3},
                {"from": 2, "to": 3}], directed: false, weighted: false
        });
    });
});

describe('Test hypercube graph', () => {
    it('Should make a hypercube graph', () => {
        const hyper0 = graphs._hypercube(0);
        const hyper1 = graphs._hypercube(1);
        const hyper2 = graphs._hypercube(2);

        expect(hyper0).to.deep.equal({nodes: [{id: 0, label: '0'}], edges: [], directed: false, weighted: false});
        expect(hyper1).to.deep.equal({
            nodes: [{id: 0, label: '0'}, {id: 1, label: '1'}],
            edges: [{"from": 0, "to": 1, "weight": 1}], directed: false, weighted: false
        });
        expect(hyper2).to.deep.equal({
            edges: [
                {"from": 0, "to": 1, "weight": 1},
                {"from": 0, "to": 2, "weight": 1},
                {"from": 1, "to": 3, "weight": 1},
                {"from": 2, "to": 3, "weight": 1}
            ],
            nodes: [
                {"id": 0, "label": "00"},
                {"id": 1, "label": "01"},
                {"id": 2, "label": "10"},
                {"id": 3, "label": "11"}
            ], directed: false, weighted: false
        });
    });
});

describe('Test custom graph', () => {
    it('Should make a custom graph', () => {
        const custom1 = graphs._custom(10, false, false);
        expect(custom1.nodes).has.lengthOf(10);
        expect(custom1.directed).to.be.false;
        expect(custom1.weighted).to.be.false;
        expect(custom1.edges).has.lengthOf(0);
    });
});