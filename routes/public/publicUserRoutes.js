const express = require('express');
const {
    signupValidation,
    loginValidation
} = require('../../middleware/userValidations');

const {
    signup,
    login,
    getPublicUser,
    getUserByName,
    logout
} = require('../../controllers/public/publicUserControllers');

const authenticateToken = require('../../middleware/authenticateToken');

const router = express.Router()

router.post('/signup', signupValidation, signup)

router.post('/login', loginValidation, login)

router.get('/logout', logout)

router.get('/:id', getPublicUser)

router.get('/search', getUserByName)

router.get('/test', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'authenticated' })
})

router.get('/:id', getPublicUser)

module.exports = router;