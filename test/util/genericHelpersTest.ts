import {expect} from 'chai';
import 'mocha';
import help from '../../src/js/util/genericHelpers';

describe('Test deep copy', () => {
    it('Should copy deeply', () => {
        const orig = {a: [{a: 1}], b: true};
        const copied = help.deepCopy(true, {}, orig);
        expect(copied).to.not.equal(orig);
        expect(copied).to.deep.equal(orig);
    });
});

describe('Test deep freeze', () => {
    it('Should deep freeze', () => {
        const frozen = help.deepFreeze({a: [{a: 1}], b: true});
        expect(frozen).to.be.frozen;
        expect(frozen.a).to.be.frozen;
        expect(frozen.a[0]).to.be.frozen;
        expect(frozen.a[0].a).to.be.frozen;
        expect(frozen.b).to.be.frozen;
    });
});

describe('Test dataset to array', () => {
    it('Should convert to array', () => {
        const arr = help.datasetToArray([{id: 1, x: 1}, {id: 2, x: 0}], 'id');
        expect(arr).to.deep.equal([1, 2]);
    });
});

describe('Test keep only some keys', () => {
    it('Should keep only some keys', () => {
        const arr = help.keepOnlyKeys([{id: 1, x: 1}, {id: 2, x: 0}], ['id']);
        expect(arr).to.deep.equal([{id: 1}, {id: 2}]);
        expect(arr).to.be.frozen;
    });
});

describe('Test get file extension', () => {
    it('Should get the file extension', () => {
        const ext = help.getFileExtension('abc.xyz.whatwhat.exe');
        expect(ext).to.equal('exe');
        expect(ext).to.be.frozen;

        const ext2 = help.getFileExtension('abc.exe');
        expect(ext2).to.equal('exe');
        expect(ext2).to.be.frozen;
    });
});

describe('Test flatten', () => {
    it('Should flatten a dict', () => {
        const flat = help.flatten({a: 1, b: 2, c: 3});
        expect(flat).to.be.frozen;
        expect(flat).to.deep.equal([1, 2, 3]);
    });
});

describe('Test rotate', () => {
    it('Should rotate a dict', () => {
        const rot = help.rotate({a: 1, b: 2, c: 3, d: 1});
        expect(rot).to.be.frozen;
        expect(rot).to.deep.equal({1: ['a', 'd'], 2: ['b'], 3: ['c']});
    });
});

describe('Test max', () => {
    it('Should get the max', () => {
        const m = help.max([0, 10, 2, -200]);
        expect(m).to.equal(10);
    });
});

describe('Test title case', () => {
    it('Should make title case', () => {
        const m = help.toTitleCase('war, what is It Good for?');
        expect(m).to.equal('War, What Is It Good For?');
    });
});