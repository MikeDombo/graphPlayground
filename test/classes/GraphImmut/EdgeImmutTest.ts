import {expect} from 'chai';
import 'mocha';
import EdgeImmut from "../../../src/js/classes/GraphImmut/EdgeImmut";

describe('Constructor', () => {
    it('Should properly be constructed with defaults', () => {
        const edge = new EdgeImmut(0, 1);
        expect(edge).to.be.a('object')
            .and.is.instanceOf(EdgeImmut)
            .and.is.frozen;
        expect(edge.toPlain()).to.deep.equal({from: 0, to: 1, weight: 1});
        expect(edge.getWeight()).to.equal(1);
    });
    it('Should properly be constructed with non-default weight', () => {
        const edge = new EdgeImmut(0, 1, 2);
        expect(edge).to.be.a('object')
            .and.is.instanceOf(EdgeImmut)
            .and.is.frozen;
        expect(edge.toPlain()).to.deep.equal({from: 0, to: 1, weight: 2});
        expect(edge.getWeight()).to.equal(2);
    });
    it('Should properly be constructed with extra attributes', () => {
        const edge = new EdgeImmut(0, 1, 1, {a: 'what'});
        expect(edge).to.be.a('object')
            .and.is.instanceOf(EdgeImmut)
            .and.is.frozen;
        expect(edge.toPlain()).to.deep.equal({a: 'what', from: 0, to: 1, weight: 1});
    });
    it('Should properly be constructed from plain', () => {
        const edge = new EdgeImmut(0, 1);

        const newEdge = new EdgeImmut(edge.toPlain());
        expect(newEdge).to.be.a('object')
            .and.is.instanceOf(EdgeImmut)
            .and.is.frozen;
        expect(newEdge).to.deep.equal(edge);
    });
    it('Should properly be constructed from plain with extraAttrs', () => {
        const edge = new EdgeImmut(0, 1, 1, {a: 'what'});

        const newEdge = new EdgeImmut(edge.toPlain());
        expect(newEdge).to.be.a('object')
            .and.is.instanceOf(EdgeImmut)
            .and.is.frozen;
        expect(newEdge).to.deep.equal(edge);
    });
});

describe('Get Methods', () => {
    const edge = new EdgeImmut(0, 1);
    it('Get From', () => {
        expect(edge.getFrom()).to.equal(0);
    });
    it('Get To', () => {
        expect(edge.getTo()).to.equal(1);
    });
    it('Get Weight', () => {
        expect(edge.getWeight()).to.equal(1);
    });
    it('Should get missing attribute', () => {
        expect(edge.getAttribute('what?')).to.be.null;
    });
    it('Should get all attributes with none existing', () => {
        expect(edge.getAllAttributes()).to.deep.equal({});
    });

    const edge2 = new EdgeImmut(0, 0, 1, {color: 'red'});
    it('Should get existing attribute', () => {
        expect(edge2.getAttribute('color')).to.equal('red');
    });
    it('Should get all attributes', () => {
        expect(edge2.getAllAttributes()).to.deep.equal({color: 'red'});
    });
});

describe('Edit Edge', () => {
    it('Edit the Weight', () => {
        const edge = new EdgeImmut(0, 1);
        expect(edge.getWeight()).to.equal(1);
        const edge2 = edge.editEdge(2);
        expect(edge2.getWeight()).to.equal(2);
        expect(edge).not.to.equal(edge2);
        expect(edge2).to.be.frozen;
    });
    it('Add Attributes', () => {
        const edge = new EdgeImmut(0, 1);
        const edge2 = edge.editEdge(null, {color: 'red'});
        expect(edge2.getWeight()).to.equal(1);
        expect(edge).not.to.equal(edge2);
        expect(edge2).to.be.frozen;
        expect(edge2.toPlain()).to.have.deep.property('color', 'red');
    });
    it('Edit Attributes', () => {
        const edge = new EdgeImmut(0, 1, 1, {color: 'red'});
        const edge2 = edge.editEdge(null, {color: 'blue'});
        expect(edge2.getWeight()).to.equal(1);
        expect(edge).not.to.equal(edge2);
        expect(edge2).to.be.frozen;
        expect(edge2.toPlain()).to.have.deep.property('color', 'blue');
    });
});