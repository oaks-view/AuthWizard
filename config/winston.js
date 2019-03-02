const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    colorize: true,
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
