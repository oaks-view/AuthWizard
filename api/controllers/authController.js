const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);

exports.signUp = (req, res) => {
    try {
        //
    } catch (err) {
        logger.error(`User signup failed. ErrMSG: ${err.message}`);
    }
};
