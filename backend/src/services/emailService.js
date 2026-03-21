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
    console.log(`Sending email to ${to} with subject: ${subject}`);
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
    console.log('Email sent successfully, messageId:', result.messageId);
    return result;
  } catch (error) {
    console.error('Brevo API Error:', error.response?.data || error.message);
    throw error;
  }
};

exports.sendTemplate = async (to, subject, templateName, data) => {
  console.log(`Rendering template ${templateName} for ${to}`);
  const htmlContent = renderTemplate(templateName, data);
  if (!htmlContent) {
    console.error(`Template rendering failed for ${templateName}`);
    return;
  }
  return await exports.sendEmail(to, subject, htmlContent);
};

// --- Transactional Wrappers ---

exports.notifyAdminNewRegistration = async (user) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'kimanimbogo1st@gmail.com';
  await exports.sendTemplate(adminEmail, 'New Registration Pending Approval', 'accountNotification', {
    userName: 'Admin',
    message: `A new worker registration is pending approval: ${user.name} (${user.email})`,
    actionUrl: `${process.env.FRONTEND_URL}/admin/pending-registrations`
  });
};

exports.notifyAdminLeaveRequest = async (user, leaveRequest) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'kimanimbogo1st@gmail.com';
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

exports.notifyWorkerNewSchedule = async (employee, schedule) => {
  const dayjs = require('dayjs');
  await exports.sendTemplate(employee.email, 'New Work Schedule Update', 'workSchedule', {
    userName: employee.name,
    date: dayjs(schedule.date).format('dddd, DD MMMM YYYY'),
    shiftName: schedule.shiftId.name,
    shiftTime: `${schedule.shiftId.startTime} - ${schedule.shiftId.endTime}`,
    isWeekendShift: schedule.isWeekendShift,
    isHolidayShift: schedule.isHolidayShift,
    notes: schedule.notes,
    actionUrl: `${process.env.FRONTEND_URL}/dashboard`
  });
};

exports.notifyAdminHolidayRequest = async (employee, holiday) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'kimanimbogo1st@gmail.com';
  const dayjs = require('dayjs');
  await exports.sendTemplate(adminEmail, 'New Holiday Work Request', 'accountNotification', {
    userName: 'Admin',
    message: `Worker ${employee.name} has requested to work on the upcoming holiday: ${holiday.name} (${dayjs(holiday.date).format('DD MMM YYYY')}).`,
    actionUrl: `${process.env.FRONTEND_URL}/admin/holidays`
  });
};

exports.notifyWorkerHolidayRequestResolved = async (employee, holiday, status) => {
  await exports.sendTemplate(employee.email, `Holiday Work Request ${status.toUpperCase()}`, 'accountNotification', {
    userName: employee.name,
    message: `Your request to work on ${holiday.name} has been ${status}.`
  });
};

exports.notifyNewMemo = async (emails, memo) => {
  await exports.sendTemplate(emails, `INTERNAL MEMO: ${memo.title}`, 'memoNotification', {
    memoTitle: memo.title,
    memoMessage: memo.message
  });
};

exports.notifyWorkerHolidayShiftCancelled = async (employee, date) => {
  await exports.sendTemplate(employee.email, 'Holiday Shift Cancelled', 'accountNotification', {
    userName: employee.name,
    message: `Your scheduled duty for the holiday on ${dayjs(date).format('DD MMM YYYY')} has been cancelled. Your dashboard has been updated accordingly.`
  });
};