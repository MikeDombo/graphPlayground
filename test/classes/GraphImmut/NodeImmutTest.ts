import NodeImmut from "../../../src/js/classes/GraphImmut/NodeImmut";
import {expect} from 'chai';
import 'mocha';

describe('Constructor', () => {
    it('Should properly be constructed with defaults', () => {
        const node = new NodeImmut(0);
        expect(node).to.be.a('object')
            .and.is.instanceOf(NodeImmut)
            .and.is.frozen;
        expect(node.getID()).to.equal(0);
        expect(node.getLabel()).to.equal('0');
        expect(node.toPlain()).to.deep.equal({id: 0, label: '0'});
    });

    it('Should properly be constructed with label', () => {
        const node = new NodeImmut(0, 'abc');
        expect(node).to.be.a('object')
            .and.is.instanceOf(NodeImmut)
            .and.is.frozen;
        expect(node.getID()).to.equal(0);
        expect(node.getLabel()).to.equal('abc');
        expect(node.toPlain()).to.deep.equal({id: 0, label: 'abc'});
    });

    it('Should properly be constructed with extraAttrs', () => {
        const node = new NodeImmut(0, null, {color: 'red'});
        expect(node).to.be.a('object')
            .and.is.instanceOf(NodeImmut)
            .and.is.frozen;
        expect(node.getID()).to.equal(0);
        expect(node.getLabel()).to.equal('0');
        expect(node.getAttribute('color')).to.equal('red');
        expect(node.getAllAttributes()).to.deep.equal({color: 'red'});
        expect(node.getAttribute('doesntExist')).to.be.null;
        expect(node.toPlain()).to.deep.equal({color: 'red', id: 0, label: '0'});
    });
});

describe('Get Methods', () => {
    const node = new NodeImmut(0);
    it('Should get ID', () => {
        expect(node.getID()).to.equal(0);
    });
    it('Should get label', () => {
        expect(node.getLabel()).to.equal('0');
    });
    it('Should get missing attribute', () => {
        expect(node.getAttribute('what?')).to.be.null;
    });
    it('Should get all attributes with none existing', () => {
        expect(node.getAllAttributes()).to.deep.equal({});
    });

    const node2 = new NodeImmut(0, '0', {color: 'red'});
    it('Should get existing attribute', () => {
        expect(node2.getAttribute('color')).to.equal('red');
    });
    it('Should get all attributes', () => {
        expect(node2.getAllAttributes()).to.deep.equal({color: 'red'});
    });

    it('Should get plain with no attributes', () => {
        expect(node.toPlain()).to.deep.equal({id: 0, label: '0'});
    });
    it('Should get plain with attributes', () => {
        expect(node2.toPlain()).to.deep.equal({id: 0, label: '0', color: 'red'});
    });
});

describe('Edit Node', () => {
    it('Should edit label', () => {
        const node = new NodeImmut(0);
        const newNode = node.editNode('abc');
        expect(newNode).to.not.equal(node);
        expect(newNode).to.be.frozen;
        expect(newNode.getLabel()).to.equal('abc');
        expect(newNode.toPlain()).to.deep.equal({id: 0, label: 'abc'});
    });
    it('Should add extra attributes', () => {
        const node = new NodeImmut(0);
        const newNode = node.editNode(null, {color: 'red'});
        expect(newNode).to.not.equal(node);
        expect(newNode).to.be.frozen;
        expect(newNode.toPlain()).to.deep.equal({id: 0, label: '0', color: 'red'});

        const node2 = new NodeImmut(0, '0', {oldKey: 1});
        const newNode2 = node2.editNode(null, {color: 'red'});
        expect(newNode2).to.not.equal(node2);
        expect(newNode2).to.be.frozen;
        expect(newNode2.toPlain()).to.deep.equal({id: 0, label: '0', color: 'red', oldKey: 1});
    });
    it('Should edit extra attributes', () => {
        const node = new NodeImmut(0, '0', {color: 'blue'});
        const newNode = node.editNode(null, {color: 'red'});
        expect(newNode).to.not.equal(node);
        expect(newNode).to.be.frozen;
        expect(newNode.toPlain()).to.deep.equal({id: 0, label: '0', color: 'red'});
    });
    it('Should change label and attributes', () => {
        const node = new NodeImmut(0, '0', {color: 'blue'});
        const newNode = node.editNode('abc', {color: 'red'});
        expect(newNode).to.not.equal(node);
        expect(newNode).to.be.frozen;
        expect(newNode.toPlain()).to.deep.equal({id: 0, label: 'abc', color: 'red'});
    });
});