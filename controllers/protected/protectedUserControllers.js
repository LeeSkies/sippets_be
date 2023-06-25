const { response } = require('express');
const Follow = require('../../models/followModel');
const Like = require('../../models/likeModel');
const Sippet = require('../../models/sippetModel');
const User = require('../../models/userModel');
const { deleteImage } = require('./imageControllers');

// refresh login
const refresh = async (req, res) => {
  const { user } = req
  const { _id, username, bio, followersCount, followingCount, theme, codeTheme } = user
  const obj = { _id, username, bio, followersCount, followingCount, theme, codeTheme }
  try {
    res.status(202).json({ ...obj, image: user?.image?.secure_url ? user.image.secure_url : null })
  } catch (error) {
    res.status(403).json({ message:error.message })
  }
}

// Get user details
const getUser = async (req, res) => {
  const { _id: userId } = req;
  try {
    const user = await User.findById(userId).select('username email image bio followersCount');
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const deleteUser = async (req, res)=> {
  const { user } = req;
  try {
    await Like.deleteMany({ user_id: user._id })
    await Follow.deleteMany({ $or: [{ follower: user._id }, { following: user._id }] });
    await Sippet.deleteMany({ author: user._id })
    await User.findByIdAndDelete(user._id);
    res.cookie('token', 'deleted')
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Update user details
const updateUser = async (req, res) => {
  const { username, email, bio, image, theme, codeTheme } = req.body;
  const { user } = req;
  try {
    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email;
    }
    if (bio) {
      user.bio = bio;
    }
    if (image) {
      if (user?.image?.public_id) {
        deleteImage(user.image.public_id)
      }
      user.image = image == 'noimage' ? null : image;
    }
    if (theme) {
      user.theme = theme;
    }
    if (codeTheme) {
      user.codeTheme = codeTheme;
    }
    user.save();
    res.status(201).json({ message: 'User updated successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const followUser = async (req, res) => {
  const { id: idToFollow } = req.params;
  const { user } = req;

  try {
    const follow = await Follow.findOne({ follower: user._id, following: idToFollow });
    let op
    if (follow) {
      await Follow.findByIdAndDelete(follow._id)
      user.followersCount --
      op = 'del'
    }
    else {
      await Follow.create({
        follower: user._id,
        following: idToFollow
      })
      user.followersCount ++
      op = 'add'
    }
    await Promise.all[
      user.save(),
      User.findByIdAndUpdate(idToFollow, { $inc: { followersCount: op == 'add' ? 1 : -1 } })
    ] 
    res.status(201).json({ message: 'Followed successfully', op });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: 'Failed to follow user' });
  }
};

const whoToFollow = async (req, res) => {
  const { user } = req
  const userIdToExclude = user._id;
  try {
    const count = await User.countDocuments()
    if (count < 1000) {
      const users = await User.aggregate([
        {
          $match: {
            _id: { $ne: userIdToExclude }
          }
        },
        {
          $sort: {
            followersCount: -1
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            image: '$image.secure_url',
          }
        }
      ]).exec()
      res.json(users.slice(0, 5));
    }
    else {
      const rnd = Math.round(Math.random() * count / 1000)
      const users = await User.aggregate([
        {
          $skip: rnd * 1000
        },
        {
          $limit: 1000
        },
        {
          $match: {
            _id: { $ne: userIdToExclude }
          }
        },
        {
          $sort: {
            followersCount: -1
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            image: '$image.secure_url',
          }
        }
      ]).exec()
      res.json(users.slice(0, 5));
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  refresh,
  getUser,
  deleteUser,
  updateUser,
  followUser,
  whoToFollow
};
