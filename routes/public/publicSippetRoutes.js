const express = require('express');

const {
    getSingleSippet,
    getUserSippets,
    getLatestSippets,
    getUserComments
} = require('../../controllers/public/publicSippetControllers');

const router = express.Router();

router.get('/single/:id', getSingleSippet)

router.get('/user/:id', getUserSippets)

router.get('/comments/:id', getUserComments)

router.get('/latest', getLatestSippets)

module.exports = router
