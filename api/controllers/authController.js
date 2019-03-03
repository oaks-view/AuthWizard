const appRoot = require('app-root-path');
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

exports.verifyUserEmail = async (req, res) => {
    try {
        logger.info(`Verify user email`);
        const { token } = req.params;
        let message;

        if (!token) {
            message = `"token is required parameter"`;
            logger.error(`No token sent ${message}`);
        }

        const dbUser = await userService.getOne({ emailVerificationToken: token });

        if (!dbUser) {
            message = `Token is invalid`;
            logger.info(`User not found for token. ${token}`);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        await userService.update({ _id: dbUser._id }, {
            emailVerified: true,
            $unset: {
                emailVerificationToken: undefined
            }
        });

        message = 'Email verification successful';
        logger.info(`${message}. User email: ${dbUser.email}`);
        return res.status(HTTP_STATUS.OK.CODE).json({
            message
        });
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
