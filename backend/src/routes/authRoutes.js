const express = require('express');
const router = express.Router();
const { login, register, getMe, updatePassword, updateProfile, requestEmailVerification, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { loginSchema, registerSchema } = require('../utils/validation/authSchemas');

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.put('/update-profile', protect, updateProfile);
router.post('/request-verification', protect, requestEmailVerification);
router.get('/confirm-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;