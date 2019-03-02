const appRoot = require('app-root-path');
const mongoose = require('mongoose');
const logger = require(`${appRoot}/config/winston`);
const dotenv = require('dotenv');
dotenv.config();

const dbConnection = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;

const options = {
    // useMongoClient: true,
    useNewUrlParser: true,
    autoIndex: false,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500,
    poolSize: 10,
    bufferMaxEntries: 0
};

mongoose.connection.on('connected', function () {
    logger.info('DB connected');
});
mongoose.connection.on('error', function (err) {
    logger.error(`DB connection error ${err}`);
});
mongoose.connection.on('disconnected', function () {
    logger.info('DB disconnected');
});

/**
 * Taking care of DB connections.
 */
process.once('SIGUSR2', function () {
    gracefulShutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGUSR2');
    });
});

process.on('SIGINT', function () {
    gracefulShutdown('app termination', function () {
        process.exit(0);
    });
});

process.on('SIGTERM', function () {
    gracefulShutdown('app shutdown', function () {
        process.exit(0);
    });
});

const gracefulShutdown = function (msg, callback) {
    mongoose.connection.close(function () {
        logger.info('Mongoose disconnected through ' + msg);
        callback();
    });
};

// Use connect method to connect to the Server
mongoose.connect(dbConnection, options, function (err, db) {
    if (err) {
        logger.error(`Unable to connect to the mongoDB server. Error: ${err}`);
    } else {
        logger.info('Connection established to database');
    }
});

module.exports = mongoose;
