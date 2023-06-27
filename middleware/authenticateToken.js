const mongoose = require('mongoose')
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const { tokenize } = require('../controllers/public/publicUserControllers');

const authenticateToken = async (req, res, next) => {
    const { token, refresh } = req.cookies
    console.log(token);
    console.log(refresh);
    try {
        // check for token existence
        if (!token && !refresh) {
            throw new Error('Login required')
        }

        // verify token and user
        try {
            const { _id } = jwt.verify(token, process.env.ACCESS_TOKEN_KEY)
            const user = await User.findById(_id)
            if (!user) {
                throw Error("couldn't verify user")
            }
            req.user = user
            return next()
        } catch (error) {
            console.log(error.message);
        }
        try {
            if (!refresh || refresh == '') {
                console.log('no refresh');
                throw Error("Login required")
            }
            const { _id } = jwt.verify(refresh, process.env.REFRESH_TOKEN_KEY)
            const user = await User.findById(_id).select('-buzzs -password -email')
            if (!user) {
                console.log('no user');
                throw Error("Login required")
            }
            if (user.refresh_token != refresh) {
                user.refresh_token = null
                user.save()
                console.log('refresh expired');
                throw Error("Login required")
            }
            req.user = user
            const token = tokenize(user._id, 'access');
            res.cookie('token', token, {
              httpOnly: true,
              sameSite: 'none',
              maxAge: 3600000,
              secure: true,
            });
            const refresh_token = tokenize(user._id, 'refresh')
            res.cookie('refresh', refresh_token, {
              httpOnly: true,
              sameSite: 'none',
              maxAge: 2592000000,
              secure: true,
            });
            req.user = user
            user.refresh_token = refresh_token;
            user.save()
            console.log('refreshed');
            return next()
        } catch (error) {
            console.log('not atoll');
            console.log(error.message);
            throw Error('Login required')            
        }
    } catch (error) {
        res.status(401).json({error: error.message})
    }
}

module.exports = authenticateToken;