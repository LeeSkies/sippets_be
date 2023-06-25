const express = require('express');

const router = express.Router()

const {
    postSippet,
    deleteSippet,
    updateSippet,
    likeSippet,
    toastSippet,
    getLikedSippets,
    getFollowingSippets,
    postComment,
    getSingleSippet,
    getLatestSippets,
    getUserComments,
    getUserSippets
} = require('../../controllers/protected/protectedSippetControllers');
const { signUpload } = require('../../controllers/protected/imageControllers');

router.post('/', postSippet)

router.post('/comment/:id', postComment)

router.post('/toast/:id', toastSippet)

router.get('/latest', getLatestSippets)

router.get('/following', getFollowingSippets)

router.get('/liked', getLikedSippets)

router.get('/single/:id', getSingleSippet)

router.get('/sign', signUpload)

router.put('/like/:id', likeSippet)

router.put('/toast/:id', toastSippet)

// router.put('/:id', updateSippet)

router.delete('/:id', deleteSippet)

module.exports = router