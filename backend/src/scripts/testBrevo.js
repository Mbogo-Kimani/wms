const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const emailService = require('../services/emailService');

const testBrevo = async () => {
  const testEmail = process.env.EMAIL_FROM_ADDRESS;
  console.log(`Sending test email to: ${testEmail}...`);
  
  try {
    const result = await emailService.sendTemplate(
      testEmail,
      'Brevo Integration Test - Industrial WMS',
      'accountNotification',
      {
        userName: 'System Developer',
        message: 'This is a successful test of the Brevo API integration and HTML template system.',
        actionUrl: 'https://industrial-wms.com'
      }
    );
    console.log('Test result:', result);
    console.log('SUCCESS: Email sent via Brevo.');
  } catch (error) {
    console.error('FAILED: Email sending failed.');
    console.error(error);
    process.exit(1);
  }
};

testBrevo();
