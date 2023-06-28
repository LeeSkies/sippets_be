const express = require('express');
const { searchByText } = require('../../controllers/public/searchControllers');

const router = express.Router()

router.get('/text', searchByText)

module.exports = router