const appRoot = require('app-root-path');
const User = require(`${appRoot}/api/models/userModel`);

/**
 * @description saves new user to the database
 * @param {{firstName: String, lastName: String, email: String, hash: String, salt: String}} newUser
 */
exports.create = (newUser) => {
    return User.create(newUser);
};

/**
 * @description fetch single user from database
 * @param {{}} query query object
 */
exports.getOne = (query) => {
    return User.findOne(query);
};

/**
 * @description find and update a saved user record
 * @param {{}} query query to find user record
 * @param {{}} update fields and new values to set
 */
exports.update = (query, update) => {
    return User.findOneAndUpdate(query, update);
};
