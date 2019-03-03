const crypto = require('crypto');
/**
 * @description Validate that an object has all the required field present
 * @param {object} payload anonymous object whose fields will be validated
 * @param {Array.<string>} requiredFields fields that will be checked in payload
 */
exports.validateRequiredParams = (payload, requiredFields) => {
    const result = {
        message: '',
        missingParam: false
    };
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        const val = payload[field];

        if (!val && val !== 0 && val !== false) {
            result.missingParam = true;
            result.message = `${field} is required`;
            return result;
        }
    }

    return result;
};

/**
 * @description validate an email is valid
 * @param {string} email email address
 */
exports.emailIsValid = (email) => {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

/**
 * @description generate random string of any arbitrary length
 * @param {number} size length of string
 */
exports.generateRandomString = (size = 16) => {
    return crypto.randomBytes(size).toString('hex');
};

/**
 * @description creates a cryptographic hash of input password
 * @param {String} salt salt
 * @param {String} password password
 */
exports.hashPassword = (salt, password) => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};
