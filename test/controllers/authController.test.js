const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const sandbox = sinon.createSandbox();
const { assert } = sandbox;
const { HTTP_STATUS, TEMPLATES } = require(`${appRoot}/api/constants/requestConstants`);

describe('AuthController', () => {
    let authController;
    let res;
    let resJson;
    let jwt;
    let helperMethods;
    let userService;
    let emailHelper;

    beforeEach(() => {
        resJson = sandbox.spy();
        res = {
            status: sandbox.stub().returns({ json: resJson })
        };

        jwt = {};
        helperMethods = {};
        userService = {};
        emailHelper = {};

        const imports = {
            jsonwebtoken: jwt
        };

        imports[`${appRoot}/api/helpers/helperMethods`] = helperMethods;
        imports[`${appRoot}/api/services/userService`] = userService;
        imports[`${appRoot}/api/helpers/emailHelper`] = emailHelper;

        authController = proxyquire(`${appRoot}/api/controllers/authController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can signup successfully', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                firstName: 'John',
                lastName: 'Doe',
                password: '123456'
            }
        };

        const salt = 'jodwueieu2ieieowodciowiejo';
        const token = 'wwkwjiujohfoqih9ehp9fhp39fhpfch9fhp9fo4qp';
        const hash = 'jkdacbajhieh9heciuwhwiufh9e93iehwei3edeiwosicwieh9ie';

        const newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            hash,
            emailVerificationToken: token,
            salt
        };

        helperMethods.generateRandomString = sandbox.stub();
        helperMethods.generateRandomString.onCall(0).returns(salt);
        helperMethods.generateRandomString.onCall(1).returns(token);
        helperMethods.hashPassword = sandbox.stub().returns(hash);
        emailHelper.sendMail = sandbox.stub();

        userService.create = sandbox.stub().resolves(newUser);

        await authController.signUp(req, res);

        const templateVariables = {
            link: `${process.env.BASE_URL}/verify-email/${token}`,
            firstName: newUser.firstName
        };

        assert.calledWith(userService.create, newUser);

        assert.calledWith(helperMethods.generateRandomString, 64);
        assert.callCount(helperMethods.generateRandomString, 2);

        assert.calledWith(helperMethods.hashPassword, salt, req.body.password);

        assert.calledWith(
            emailHelper.sendMail,
            newUser.email,
            'AuthWizard :: Welcome Aboard',
            TEMPLATES.VERIFY_EMAIL,
            templateVariables
        );

        assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        assert.calledWith(resJson, { message: 'User registration was successful' });
    });

    it('returns status code of 500 when server error occurs', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                firstName: 'John',
                lastName: 'Doe',
                password: '123456'
            }
        };

        const salt = 'jodwueieu2ieieowodciowiejo';
        const token = 'wwkwjiujohfoqih9ehp9fhp39fhpfch9fhp9fo4qp';
        const hash = 'jkdacbajhieh9heciuwhwiufh9e93iehwei3edeiwosicwieh9ie';

        const newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            hash,
            emailVerificationToken: token,
            salt
        };

        helperMethods.generateRandomString = sandbox.stub();
        helperMethods.generateRandomString.onCall(0).returns(salt);
        helperMethods.generateRandomString.onCall(1).returns(token);
        helperMethods.hashPassword = sandbox.stub().returns(hash);

        userService.create = sandbox.stub().rejects(new Error('Database connection error'));

        await authController.signUp(req, res);

        assert.calledWith(userService.create, newUser);

        assert.calledWith(helperMethods.generateRandomString, 64);
        assert.callCount(helperMethods.generateRandomString, 2);

        assert.calledWith(helperMethods.hashPassword, salt, req.body.password);

        assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('login returns status code of 400 when email is missing', async () => {
        const req = {
            body: {
                password: '123456'
            }
        };

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        assert.calledWith(resJson, {
            message: `email is required`
        });
    });

    it('login returns status code of 400 when password is missing', async () => {
        const req = {
            body: {
                email: 'john@email.com'
            }
        };

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        assert.calledWith(resJson, {
            message: `password is required`
        });
    });

    it('login returns status code 403 when user is not found for email', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                password: '123456'
            }
        };

        userService.getOne = sandbox.stub().resolves(null);

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        assert.calledWith(resJson, {
            message: 'User login failed. Please check username and password'
        });
    });

    it('login returns status code 403 password hashes dont match', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                password: '123456'
            }
        };

        const hash = 'dbdihicuwdhwehquewoqlihep39pruhforlif';

        helperMethods.hashPassword = sandbox.stub().returns(hash);

        const dbUser = {
            hash: 'jdkcjo2hdoiehowhdoieewece0eohncoehdhp9hkbwiubiwhcwikwi',
            salt: 'jijkehdehdehd9uej344oed3o'
        };

        userService.getOne = sandbox.stub().resolves(dbUser);

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        assert.calledWith(helperMethods.hashPassword, dbUser.salt, req.body.password);
        assert.calledWith(resJson, {
            message: 'User login failed. Please check username and password.'
        });
    });

    it('login returns status code 403 when email is not verified', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                password: '123456'
            }
        };

        const hash = 'dbdihicuwdhwehquewoqlihep39pruhforlif';

        helperMethods.hashPassword = sandbox.stub().returns(hash);

        const dbUser = {
            hash,
            salt: 'jijkehdehdehd9uej344oed3o',
            emailVerified: false
        };

        userService.getOne = sandbox.stub().resolves(dbUser);

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        assert.calledWith(helperMethods.hashPassword, dbUser.salt, req.body.password);
        assert.calledWith(resJson, {
            message: 'User login failed. Email is not verified'
        });
    });

    it('login generates jsonwebtoken if login is successfull', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                password: '123456'
            }
        };

        const hash = 'dbdihicuwdhwehquewoqlihep39pruhforlif';

        helperMethods.hashPassword = sandbox.stub().returns(hash);

        const dbUser = {
            _id: 'dddowhdioi0odwie0oeoiw',
            email: req.body.email,
            hash,
            salt: 'jijkehdehdehd9uej344oed3o',
            emailVerified: true
        };

        const data = {
            sub: dbUser._id.toString(),
            email: dbUser.email
        };

        const token = 'ncndcndcnown3ioj0j0ijcicwoinwiononoi';

        jwt.sign = sandbox.stub().returns(token);

        userService.getOne = sandbox.stub().resolves(dbUser);

        await authController.login(req, res);

        assert.calledWith(jwt.sign, data, process.env.JWT_SECRET);

        assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        assert.calledWith(helperMethods.hashPassword, dbUser.salt, req.body.password);
        assert.calledWith(resJson, { token });
        assert.calledWith(userService.getOne, { email: req.body.email }, true);
    });

    it('login returns status code 500 when server error occurs', async () => {
        const req = {
            body: {
                email: 'john@email.com',
                password: '123456'
            }
        };

        userService.getOne = sandbox.stub().rejects(new Error('Database connection error'));

        await authController.login(req, res);

        assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });

        assert.calledWith(userService.getOne, { email: req.body.email }, true);
    });

    it('verifyUserEmail fails if token is missing', async () => {
        const req = {
            params: {
            }
        };

        res.render = sandbox.stub();

        const options = {
            message: 'Email verification link is invalid or expired'
        };

        await authController.verifyUserEmail(req, res);

        assert.calledWith(res.render, 'emailVerificationFeedback', options);
    });

    it('verifyUserEmail fails if user is not found for token', async () => {
        const req = {
            params: {
                token: 'kdbcbldciwhn9euhoeh9ee2oh92h284oh9dh9'
            }
        };

        res.render = sandbox.stub();
        userService.getOne = sandbox.stub().resolves(null);

        const options = {
            message: 'Email verification link is invalid or expired'
        };

        await authController.verifyUserEmail(req, res);

        assert.calledWith(res.render, 'emailVerificationFeedback', options);
        assert.calledWith(userService.getOne, { emailVerificationToken: req.params.token });
    });

    it('verifyUserEmail notifies caller if user email is already verified', async () => {
        const req = {
            params: {
                token: 'kdbcbldciwhn9euhoeh9ee2oh92h284oh9dh9'
            }
        };

        res.render = sandbox.stub();
        const dbUser = {
            emailVerified: true,
            firstName: 'John',
            lastName: 'Doe'
        };
        userService.getOne = sandbox.stub().resolves(dbUser);
        userService.update = sandbox.stub();

        const options = {
            message: `Hello ${dbUser.firstName}, your email has already been verified`
        };

        await authController.verifyUserEmail(req, res);

        assert.notCalled(userService.update);

        assert.calledWith(res.render, 'emailVerificationFeedback', options);
        assert.calledWith(userService.getOne, { emailVerificationToken: req.params.token });
    });

    it('verifyUserEmail suceeds if user is found for token and emailVerified is false', async () => {
        const req = {
            params: {
                token: 'kdbcbldciwhn9euhoeh9ee2oh92h284oh9dh9'
            }
        };

        res.render = sandbox.stub();
        const dbUser = {
            _id: 'idijweineoedj0ehijiehc39hni03',
            email: 'john@email.com',
            emailVerified: false,
            firstName: 'John',
            lastName: 'Doe'
        };
        userService.getOne = sandbox.stub().resolves(dbUser);
        userService.update = sandbox.stub();

        const options = {
            message: `Hello ${dbUser.firstName}, your email has been verified successfully!`
        };

        await authController.verifyUserEmail(req, res);

        assert.calledWith(userService.update, { _id: dbUser._id }, {
            emailVerified: true,
            $unset: {
                emailVerificationToken: undefined
            }
        });

        assert.calledWith(res.render, 'emailVerificationFeedback', options);
        assert.calledWith(userService.getOne, { emailVerificationToken: req.params.token });
    });

    it('verifyUserEmail returns status code 500 if server error occurs', async () => {
        const req = {
            params: {
                token: 'kdbcbldciwhn9euhoeh9ee2oh92h284oh9dh9'
            }
        };
        userService.getOne = sandbox.stub().rejects(new Error('Database connection error'));

        await authController.verifyUserEmail(req, res);

        assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        assert.calledWith(userService.getOne, { emailVerificationToken: req.params.token });
        assert.calledWith(resJson, { message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE });
    });
});
