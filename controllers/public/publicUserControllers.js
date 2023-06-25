const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const Filter = require('bad-words')

const filter = new Filter()

const User = require('../../models/userModel');

// Create a JWT token
const tokenize = (_id, action) => {
  if (action === 'access') {
    return jwt.sign({ _id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '15m' });
  }
  if (action === 'refresh') {
    return jwt.sign({ _id }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '30d' })
  }
};

// Sign up a user
const signup = async (req, res) => {
  const { email, username: name, password: p } = req.body;

  if (filter.isProfane(name)) {
    return res.status(400).json({ message: '!nope!' })
  }

  try {
    const password = bcrypt.hashSync(p, 10);
    const user = await User.create({ username: name, email, password });

    // issuing an access token
    const token = tokenize(user._id, 'access');
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      maxAge: 900000,
      secure: true,
    });

    // issuing a refresh token
    const refresh_token = tokenize(user._id, 'refresh')
    res.cookie('refresh', refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      maxAge: 2592000000,
      secure: true,
    });

    const { _id, username, bio, followersCount, followingCount, theme, codeTheme } = user
    const obj = { _id, username, bio, followersCount, followingCount, theme, codeTheme }
    user.refresh_token = refresh_token
    user.save()
    res.status(202).json({ ...obj, image: user?.image?.secure_url ? user.image.secure_url : null })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'An error occurred while creating the user', error: error.message });
  }
};

// Log in a user
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email }).select('-email -refresh_token');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // issuing an access token
    const token = tokenize(user._id, 'access');
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      maxAge: 3600000,
      secure: true,
    });

    // issuing a refresh token
    const refresh_token = tokenize(user._id, 'refresh')
    res.cookie('refresh', refresh_token, {
      httpOnly: true,
      sameSite: 'none',
      maxAge: 2592000000,
      secure: true,
    });

    user.refresh_token = refresh_token
    user.save()

    delete user.password
        
    res.status(200).json({ message: 'Logged in successfully', user });
  } catch (err) {
    console.log(err);
    
    return res.status(500).json({ message: err.message });
  }
};

// Get public user details
const getPublicUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id)
      .select('-email -password -buzzs')
    const { _id, username, bio, followersCount, followingCount, theme, codeTheme } = user
    const obj = { _id, username, bio, followersCount, followingCount, theme, codeTheme }
    res.status(202).json({ ...obj, image: user?.image?.secure_url ? user.image.secure_url : null })
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Search user by name
const getUserByName = async (req, res) => {
  const { name } = req.query;
  const offset = req.query.offset || 0;

  try {
    const user = await User.find({ username: { $regex: name } })
      .skip(offset * 10)
      .limit(10)
      .select('username image bio following')
      .populate({
        path: 'following',
        select: 'image username',
        options: { limit: 3 },
      });
    res.status(200).json({ _id, username, image, bio, followingCount, followersCount } = user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getPublicUser,
  getUserByName,
  tokenize
};
