const appRoot = require('app-root-path');
const authController = require(`${appRoot}/api/controllers/authController`);

module.exports = (router) => {
    router.route('/signup')
        .post(authController.validateSignupParams, authController.signUp);

    router.route('/verify-email/:token')
        .get(authController.verifyUserEmail);
};
