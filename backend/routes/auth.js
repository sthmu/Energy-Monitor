const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// User registration and OTP verification
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);

// User login
router.post('/login', authController.login);

// Password reset flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Get current user (requires authentication)
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

module.exports = router;