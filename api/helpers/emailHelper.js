const appRoot = require('app-root-path');
const dotenv = require('dotenv');
const handlebars = require('handlebars');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require(`${appRoot}/config/winston`);

dotenv.config();

/**
 * @description finds email template and injects needed variables
 * @param {string} templateName name of html file
 * @param {object} templateVariables contains variables needed in email template as keys
 */
exports.createEmailTemplate = (templateName, templateVariables) => {
    let path = `${appRoot}/public/templates/${templateName}.html`;
    let html = fs.readFileSync(path, 'utf8');

    var template = handlebars.compile(html);

    return template(templateVariables);
};

/**
 * @description sends out emails
 * @param {string} to email address of receiver
 * @param {string} templateName name of html file
 * @param object} templateVariables contains variables needed in email template as keys
 */
exports.sendMail = (to, subject, templateName, templateVariables) => {
    return new Promise((resolve, reject) => {
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                reject(new Error('error occured creating test account'));
            }

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: 587,
                secureConnection: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                },
                requireTLS: true
            });

            const html = this.createEmailTemplate(templateName, templateVariables);
            const mailOptions = {
                from: '"AuthWizard" <auth@wizard.io>',
                to,
                subject,
                text: subject,
                html
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(`error occured sending mail ${error}`);
                    reject(error);
                }
                resolve(info);
            });
        });
    });
};
