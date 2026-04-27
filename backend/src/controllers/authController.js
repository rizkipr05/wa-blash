const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const crypto = require('crypto');

const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

exports.register = async (req, res) => {
  const { username, password, recaptchaToken, referralCode: usedReferralCode } = req.body;

  try {
    // reCAPTCHA bypass for testing if secret is not set correctly or in dev
    if (process.env.NODE_ENV !== 'production' && !recaptchaToken) {
       // Allow for now to prevent blocking user in dev
    } else {
      const recapResponse = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'}&response=${recaptchaToken}`
      );
      if (!recapResponse.data.success) {
        return res.status(400).json({ message: 'reCAPTCHA verification failed' });
      }
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.' 
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username ini sudah digunakan oleh orang lain. Silakan pilih username yang berbeda!' });
    }

    // Handle Referrer
    let referrerId = null;
    if (usedReferralCode) {
      const normalizedCode = String(usedReferralCode).trim().toUpperCase();
      const referrer = await prisma.user.findUnique({ where: { referralCode: normalizedCode } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        referralCode: generateReferralCode(),
        referredBy: referrerId
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful', token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Kombinasi Username & Password Admin tidak valid' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Akses Ditolak: Akun Anda bukan Administrator!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Kombinasi Username & Password Admin tidak valid' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Selamat datang, Administrator!', token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in admin', error: error.message });
  }
};
