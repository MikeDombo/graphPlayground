import {expect} from 'chai';
import 'mocha';
import help from '../../src/js/util/graphHelpers';

describe('Test find vertex degrees directional', () => {
    it('Should find vertex degrees directional', () => {
        const v = help.findVertexDegreesDirectional([]);
        expect(v).to.deep.equal([]);

        const v2 = help.findVertexDegreesDirectional([
            [0, 4],
            [],
            [0],
            [],
            [],
            [1]
        ]);
        expect(v2).to.deep.equal([
            {in: 2, out: 2},
            {in: 1, out: 0},
            {in: 0, out: 1},
            {in: 0, out: 0},
            {in: 1, out: 0},
            {in: 0, out: 1}
        ]);
    });
});

describe('Test interpolate nodes from edges', () => {
    it('Should interpolate nodes from edges', () => {
        const nodes = help.interpolateNodesFromEdges([]);
        expect(nodes).to.have.lengthOf(0);

        const nodes2 = help.interpolateNodesFromEdges([{from: 0, to: 0, weight: 1}]);
        expect(nodes2).to.have.lengthOf(1);
        expect(nodes2[0]).to.deep.equal({id: 0, label: '0'});

        const nodes3 = help.interpolateNodesFromEdges([{from: 1, to: 3, weight: 1}, {from: 10, to: 4, weight: 1}]);
        expect(nodes3).to.have.lengthOf(11);
        expect(nodes3[0]).to.be.undefined;
        expect(nodes3[1]).to.deep.equal({id: 1, label: '1'});
        expect(nodes3[10]).to.deep.equal({id: 10, label: '10'});
    });
});