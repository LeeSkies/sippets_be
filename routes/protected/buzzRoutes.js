const express = require('express');
const {
    getUnreadBuzzs, getAllBuzzs, updateBuzzs
} = require('../../controllers/protected/buzzControllers');

const router = express.Router()

router.get('/', getAllBuzzs)

router.get('/unread', getUnreadBuzzs)

router.put('/', updateBuzzs)

module.exports = router