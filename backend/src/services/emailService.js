// src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

// Create test account if no credentials
let transporter;

const initTransporter = async () => {
  // Use the provided Gmail credentials
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pqrsabcd613@gmail.com',
      pass: 'idiu gyou wpua dtqx'
    }
  });

  logger.info('Using Gmail for email sending');
};

// Initialize transporter
initTransporter();

/**
 * Send email
 * @param {Object} options - Email options
 */
exports.sendEmail = async (options) => {
  try {
    if (!transporter) {
      await initTransporter();
    }

    const mailOptions = {
      from: `"Siyoga Travels" <${config.EMAIL_FROM || 'noreply@siyogatravels.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent: ${info.messageId}`);

    // Log URL for ethereal emails in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Email preview: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error(`Email error: ${error.message}`);
    throw error;
  }
};