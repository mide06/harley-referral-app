const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_temp');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// --------------------- REGISTER ---------------------
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, referrerUsername } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Handle referral (using username)
    let referredBy = null;
    if (referrerUsername) {
      const referrer = await User.findOne({ username: referrerUsername });
      if (referrer) {
        referredBy = referrer.username; // store username for easier lookup
      }
    }

    // Create new user
    const newUser = new User({
      name,
      username,
      email,
      password: hashed,
      referredBy,
    });
    await newUser.save();

    // Add new user to referrer's referral list
    if (referredBy) {
      const referrer = await User.findOne({ username: referredBy });
      if (referrer) {
        referrer.referrals.push({ user: newUser._id, status: 'pending' });
        await referrer.save();
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Generate referral link (username-based)
    const referralLink = `${req.protocol}://${req.get('host')}/form?ref=${newUser.username}`;

    res.json({
      success: true,
      message: 'Registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        referredBy,
        referralLink,
      },
      token,
    });
  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --------------------- LOGIN ---------------------
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Check if user exists by email OR username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'User not found' });

    // Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ success: false, message: 'Invalid password' });

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Referral link for dashboard
    const referralLink = `${req.protocol}://${req.get('host')}/form?ref=${user.username}`;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        referredBy: user.referredBy,
        referralLink,
      },
      token,
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// --------------------- TOKEN VERIFICATION ---------------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ success: false, message: 'No token provided' });

  // Split and trim to avoid invisible spaces
  const token = authHeader.split(' ')[1]?.trim();

  if (!token)
    return res.status(401).json({ success: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT verify error:", err.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;

// --------------------- GET REFERRALS ---------------------
router.get('/referrals', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('referrals.user', 'name username email createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const referralsList = user.referrals.map(ref => ({
      id: ref.user?._id,
      name: ref.user?.name,
      username: ref.user?.username,
      email: ref.user?.email,
      status: ref.status,
      createdAt: ref.user?.createdAt,
    }));

    res.json({
      success: true,
      referrals: referralsList,
    });
  } catch (err) {
    console.error('❌ Referral Fetch Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --------------------- GET CURRENT USER ---------------------
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('referrals.userId', 'name username email createdAt')
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const referralLink = `${req.protocol}://${req.get('host')}/form?ref=${user.username}`;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        referredBy: user.referredBy,
        referrals: user.referrals,
        referralLink,
      },
    });
  } catch (err) {
    console.error('❌ /me Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --------------------- UPDATE PROFILE ---------------------
router.put('/update', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // For security / simplicity we only allow password changes through this endpoint.
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to update' });
    }

    if (typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('❌ Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
