const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configure email transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY || 10));

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      otp: {
        code: otp,
        expiry: otpExpiry,
        verified: false
      }
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Energy Monitoring System',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${name},</p>
        <p>Thank you for registering with our Energy Monitoring System. Your OTP for email verification is:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in ${process.env.OTP_EXPIRY || 10} minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      message: 'User registered. Please verify your email with the OTP sent to your email address.',
      userId: newUser.id
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP is valid and not expired
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otp.expiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified
    user.otp.verified = true;
    await User.update(userId, { otp: user.otp });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      message: 'Email verified successfully',
      token,
      userId: user.id,
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user email is verified
    if (!user.otp.verified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpiry = new Date();
      otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY || 10));
      
      user.otp.code = otp;
      user.otp.expiry = otpExpiry;
      await User.update(user.id, { otp: user.otp });
      
      // Send new OTP email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Energy Monitoring System',
        html: `
          <h1>Email Verification</h1>
          <p>Hi ${user.name},</p>
          <p>Your email is not yet verified. Your new OTP for email verification is:</p>
          <h2>${otp}</h2>
          <p>This OTP will expire in ${process.env.OTP_EXPIRY || 10} minutes.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      
      return res.status(401).json({ 
        message: 'Email not verified. A new OTP has been sent to your email.',
        userId: user.id
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user.id,
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive data
    const { password, otp, ...userWithoutSensitiveData } = user;
    
    res.status(200).json(userWithoutSensitiveData);
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }
    
    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + parseInt(process.env.OTP_EXPIRY || 10));
    
    user.otp.code = otp;
    user.otp.expiry = otpExpiry;
    await User.update(user.id, { otp: user.otp });
    
    // Send password reset email with OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - Energy Monitoring System',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP will expire in ${process.env.OTP_EXPIRY || 10} minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Password reset OTP sent to your email',
      userId: user.id
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if OTP is valid and not expired
    if (user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > user.otp.expiry) {
      return res.status(400).json({ message: 'OTP expired' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp.code = null;
    await User.update(userId, { 
      password: hashedPassword, 
      otp: { ...user.otp, code: null } 
    });
    
    res.status(200).json({ message: 'Password reset successful' });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};