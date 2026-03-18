const { BrevoClient } = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

/**
 * Loads and renders an HTML template with provided data
 */
const renderTemplate = (templateName, data = {}) => {
  const filePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
  if (!fs.existsSync(filePath)) {
    console.error(`Template not found: ${templateName}`);
    return '';
  }
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // Basic placeholder replacement
  const defaultData = {
    year: new Date().getFullYear(),
    companyName: 'Industrial WMS',
    actionUrl: process.env.FRONTEND_URL
  };

  const finalData = { ...defaultData, ...data };

  Object.keys(finalData).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, finalData[key]);
  });

  return html;
};

exports.sendEmail = async (to, subject, htmlContent) => {
  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { 
        name: process.env.EMAIL_FROM_NAME || "Industrial WMS", 
        email: process.env.EMAIL_FROM_ADDRESS 
      },
      to: Array.isArray(to) 
        ? to.map(email => ({ email })) 
        : to.split(',').map(email => ({ email: email.trim() }))
    });
    return result;
  } catch (error) {
    console.error('Brevo API Error:', error);
    throw error;
  }
};

exports.sendTemplate = async (to, subject, templateName, data) => {
  const htmlContent = renderTemplate(templateName, data);
  return await exports.sendEmail(to, subject, htmlContent);
};

// --- Transactional Wrappers ---

exports.notifyAdminNewRegistration = async (user) => {
  const adminEmail = 'mbogoestonkim@gmail.com';
  await exports.sendTemplate(adminEmail, 'New Registration Pending Approval', 'accountNotification', {
    userName: 'Admin',
    message: `A new worker registration is pending approval: ${user.name} (${user.email})`,
    actionUrl: `${process.env.FRONTEND_URL}/admin/pending-registrations`
  });
};

exports.notifyAdminLeaveRequest = async (user, leaveRequest) => {
  const adminEmail = 'mbogoestonkim@gmail.com';
  await exports.sendTemplate(adminEmail, 'New Leave Request', 'accountNotification', {
    userName: 'Admin',
    message: `A new ${leaveRequest.leaveType} leave request was submitted by ${user.name} from ${leaveRequest.startDate} to ${leaveRequest.endDate}.`,
    actionUrl: `${process.env.FRONTEND_URL}/admin/leaves`
  });
};

exports.notifyWorkerVerified = async (user) => {
  await exports.sendTemplate(user.email, 'Your Account Has Been Verified', 'welcome', {
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    actionUrl: `${process.env.FRONTEND_URL}/login`
  });
};

exports.notifyWorkerRejected = async (user) => {
  await exports.sendTemplate(user.email, 'Registration Not Approved', 'accountNotification', {
    userName: user.name,
    message: 'Unfortunately, your registration for the Workforce Management System was not approved at this time.'
  });
};

exports.sendLeaveApprovalEmail = async (email, employeeName, startDate, endDate, status) => {
  await exports.sendTemplate(email, `Leave Request ${status.toUpperCase()}`, 'accountNotification', {
    userName: employeeName,
    message: `Your leave request from ${startDate} to ${endDate} has been ${status}.`
  });
};

exports.sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await exports.sendTemplate(user.email, 'Verify Your Email Address', 'verificationEmail', {
    userName: user.name,
    actionUrl: verificationUrl
  });
};

exports.sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await exports.sendTemplate(user.email, 'Password Reset Request', 'passwordReset', {
    userName: user.name,
    actionUrl: resetUrl
  });
};