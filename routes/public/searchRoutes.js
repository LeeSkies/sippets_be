const express = require('express');
const { searchByText, searchByUser } = require('../../controllers/public/searchControllers');

const router = express.Router()

router.get('/text', searchByText)

router.get('/user', searchByUser)

module.exports = router