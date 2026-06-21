const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
};
