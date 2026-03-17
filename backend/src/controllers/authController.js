const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, religion, religiousRestDay } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.sendError('User already exists', 400);

    const user = await User.create({ 
      name, email, password, religion, religiousRestDay,
      accountStatus: 'pending',
      role: 'worker'
    });

    try {
      await emailService.notifyAdminNewRegistration(user);
    } catch (emailErr) {
      console.error('Email Notification Failed:', emailErr.message);
    }

    res.sendSuccess({ userId: user._id }, 'Registration successful. Awaiting approval.', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.matchPassword(password))) {
      return res.sendError('Invalid credentials', 401);
    }

    if (user.accountStatus === 'pending') {
      return res.sendError('Your account is awaiting approval.', 403);
    }

    if (user.accountStatus === 'suspended') {
      return res.sendError('Your account has been suspended.', 403);
    }

    let employee;
    if (user.accountStatus === 'verified') {
        employee = await Employee.findOne({ userId: user._id });
    }

    const token = generateToken(user);
    res.sendSuccess({ 
        token, 
        user: { 
            id: user._id, 
            name: user.name, 
            role: user.role, 
            employeeId: employee ? employee.employeeId : null,
            accountStatus: user.accountStatus
        } 
    });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.sendError('User not found', 404);

    const employee = await Employee.findOne({ userId: user._id })
      .populate('shiftId')
      .populate('workPolicy');

    res.sendSuccess({ user, employee });
  } catch (err) { next(err); }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!(await user.matchPassword(currentPassword))) {
      return res.sendError('Current password incorrect', 401);
    }

    user.password = newPassword;
    await user.save();
    
    res.sendSuccess(null, 'Password updated successfully');
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, profilePhoto } = req.body;
    const user = await User.findById(req.user.id);
    const employee = await Employee.findOne({ userId: user._id });

    if (name) user.name = name;
    if (email && email !== user.email) {
      user.email = email;
      user.isEmailVerified = false;
      if (employee) employee.email = email;
    }
    await user.save();

    if (employee) {
      if (phone !== undefined) employee.phone = phone;
      if (name) employee.name = name;
      if (profilePhoto) employee.profilePhoto = profilePhoto;
      await employee.save();
    }

    res.sendSuccess({ user, employee }, 'Profile updated successfully');
  } catch (err) { next(err); }
};

exports.requestEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isEmailVerified) return res.sendError('Email already verified', 400);

    const token = require('crypto').randomBytes(32).toString('hex');
    user.verificationToken = token;
    await user.save();

    await emailService.sendVerificationEmail(user, token);
    res.sendSuccess(null, 'Verification email sent');
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.sendError('Invalid or expired verification token', 400);

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.accountStatus = 'verified'; 
    await user.save();

    res.sendSuccess(null, 'Email verified successfully');
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.sendError('No account found with this email', 404);

    const token = require('crypto').randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    await emailService.sendPasswordResetEmail(user, token);
    res.sendSuccess(null, 'Reset link sent to your email');
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.sendError('Invalid or expired reset token', 400);

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.sendSuccess(null, 'Password reset successful');
  } catch (err) { next(err); }
};