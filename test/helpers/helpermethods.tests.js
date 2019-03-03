const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('chai');
const { assert } = sandbox;

describe('HelperMethods', () => {
    let helperMethods;
    let crypto;
    beforeEach(() => {
        crypto = {};

        const imports = {
            crypto
        };

        helperMethods = proxyquire(`${appRoot}/api/helpers/helperMethods`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can validate emails', () => {
        const email1 = 'a@hj';

        expect(helperMethods.emailIsValid(email1)).to.be.equal(false);
    });

    it('generates random string of length 16 by default', () => {
        const toString = sandbox.spy();
        crypto.randomBytes = sandbox.stub().returns({
            toString
        });
        helperMethods.generateRandomString();

        assert.calledWith(crypto.randomBytes, 16);
        assert.calledWith(toString, 'hex');
    });

    it('generates random string of arbitrary length', () => {
        const toString = sandbox.spy();
        crypto.randomBytes = sandbox.stub().returns({
            toString
        });
        helperMethods.generateRandomString(64);

        assert.calledWith(crypto.randomBytes, 64);
        assert.calledWith(toString, 'hex');
    });

    it('can create cryptographic hash of password and salt', () => {
        const toString = sandbox.spy();
        crypto.pbkdf2Sync = sandbox.stub().returns({
            toString
        });

        const salt = 'cnodjosndossfdvf';
        const password = '123456';

        helperMethods.hashPassword(salt, password);

        assert.calledWith(crypto.pbkdf2Sync, password, salt, 1000, 64, 'sha512');
        assert.calledWith(toString, 'hex');
    });
});
