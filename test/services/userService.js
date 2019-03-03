const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const sandbox = sinon.createSandbox();
const { assert } = sandbox;

describe('userService', () => {
    let userService;
    let User;

    beforeEach(() => {
        User = {};

        const imports = {
        };

        imports[`${appRoot}/api/models/userModel`] = User;

        userService = proxyquire(`${appRoot}/api/services/userService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can create new user', () => {
        const newUser = {
            email: 'a@b.com',
            firstName: 'Ali',
            lastName: 'James'
        };

        User.create = sandbox.stub();

        userService.create(newUser);

        assert.calledWith(User.create, newUser);
    });

    it('can get single user without salt and hash', () => {
        const query = { _id: 'jcocjccsicoceohneh9' };

        const select = sandbox.spy();

        User.findOne = sandbox.stub().returns({ select });

        userService.getOne(query);

        assert.calledWith(User.findOne, query);
        assert.notCalled(select);
    });

    it('can get single user with salt and hash', () => {
        const query = { _id: 'jcocjccsicoceohneh9' };

        const select = sandbox.spy();

        User.findOne = sandbox.stub().returns({ select });

        userService.getOne(query, true);

        assert.calledWith(User.findOne, query);
        assert.calledWith(select, '+hash +salt');
    });

    it('can update a user', () => {
        const query = { _id: 'jcocjccsicoceohneh9' };
        const updates = { firstName: 'Mason' };

        User.findOneAndUpdate = sandbox.spy();

        userService.update(query, updates);

        assert.calledWith(User.findOneAndUpdate, query, updates);
    });
});
