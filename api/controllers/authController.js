const appRoot = require('app-root-path');
const jwt = require('jsonwebtoken');
const logger = require(`${appRoot}/config/winston`);
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const emailHelper = require(`${appRoot}/api/helpers/emailHelper`);
const userService = require(`${appRoot}/api/services/userService`);
const { HTTP_STATUS, TEMPLATES } = require(`${appRoot}/api/constants/requestConstants`);

exports.signUp = async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        logger.info('User signup');
        let message;

        const user = {
            email,
            firstName,
            lastName
        };

        const salt = helperMethods.generateRandomString();
        const token = helperMethods.generateRandomString(64);

        user.hash = helperMethods.hashPassword(salt, password);
        user.salt = salt;
        user.emailVerificationToken = token;

        const newUser = await userService.create(user);

        const link = `${process.env.BASE_URL}/verify-email/${token}`;
        const template = TEMPLATES.VERIFY_EMAIL;

        const templateVariables = { link, template, firstName };

        emailHelper.sendMail(newUser.email, 'AuthWizard :: Welcome Aboard', template, templateVariables);

        message = 'User registration was successful';
        logger.info(message);

        return res.status(HTTP_STATUS.OK.CODE).json({
            message
        });
    } catch (err) {
        logger.error(`User signup failed. ErrMSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.login = async (req, res) => {
    try {
        logger.info(`User login`);

        const result = helperMethods.validateRequiredParams(req.body, ['email', 'password']);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const { email } = req.body;

        const dbUser = await userService.getOne({ email }, true);
        if (!dbUser) {
            const message = 'User login failed';
            logger.error(`${message}. No user found for email: ${email}`);

            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: `${message}. Please check username and password`
            });
        }

        const hash = helperMethods.hashPassword(dbUser.salt, req.body.password);

        if (hash !== dbUser.hash) {
            logger.error(`User authentication failed. Password mismatch for user ${dbUser._id}`);
            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: 'User login failed. Please check username and password.'
            });
        }

        if (!dbUser.emailVerified) {
            const message = 'Email is not verified';
            logger.error(`User login failed. ${message}`);
            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: `User login failed. ${message}`
            });
        }

        // generate jwt
        const data = {
            sub: dbUser._id.toString(),
            email: dbUser.email
        };
        const token = jwt.sign(data, process.env.JWT_SECRET);

        return res.status(HTTP_STATUS.OK.CODE).json({ token });
    } catch (err) {
        logger.error(`Login failed. ErrMSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.verifyUserEmail = async (req, res) => {
    try {
        logger.info(`Verify user email`);
        const { token } = req.params;
        let message;

        if (!token) {
            message = `"token is required parameter"`;
            logger.error(`No token sent ${message}`);

            const options = {
                message: 'Email verification link is invalid or expired'
            };
            return res.render('emailVerificationFeedback', options);
        }

        const dbUser = await userService.getOne({ emailVerificationToken: token });

        if (!dbUser) {
            logger.error(`User not found for token. ${token}`);

            const options = {
                message: 'Email verification link is invalid or expired'
            };
            return res.render('emailVerificationFeedback', options);
        }

        if (dbUser.emailVerified === true) {
            const options = {
                message: `Hello ${dbUser.firstName}, your email has already been verified`
            };
            return res.render('emailVerificationFeedback', options);
        }

        await userService.update({ _id: dbUser._id }, {
            emailVerified: true,
            $unset: {
                emailVerificationToken: undefined
            }
        });

        const options = {
            message: `Hello ${dbUser.firstName}, your email has been verified successfully!`
        };

        logger.info(`Email verification successful. User email: ${dbUser.email}`);
        return res.status(HTTP_STATUS.OK.CODE).render('emailVerificationFeedback', options);
    } catch (err) {
        logger.error(`Email Verification failed. ErrMSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateSignupParams = async (req, res, next) => {
    try {
        logger.info('Validating required fields for email signup');
        const requiredFields = ['email', 'firstName', 'lastName', 'password', 'confirmPassword'];

        const result = helperMethods.validateRequiredParams(req.body, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        let message;

        const { email } = req.body;
        const emailIsValid = helperMethods.emailIsValid(email);

        if (!emailIsValid) {
            message = `${email} is not a valid email`;
            logger.error(`Email validation failed: ${message}`);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        const existingUser = await userService.getOne({ email });

        if (existingUser) {
            message = 'User with this email already exists';
            logger.error(`${message}. email: ${email}`);

            return res.status(HTTP_STATUS.CONFLICT.CODE).json({
                message
            });
        }

        const { password, confirmPassword } = req.body;

        if (password.length < 6) {
            message = 'password must be at least 6 characters';
            logger.error(`Password validation failed: ${message}`);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        if (password !== confirmPassword) {
            message = '"password" and "confirmPassword" must be equal';
            logger.error(`Password validation failed: ${message}`);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        next();
    } catch (err) {
        logger.error(`User signup failed. ErrMSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    };
};
