const express = require('express');
const {
    createConversation,
    getUserConversations,
    getConversation
} = require('../../controllers/protected/protectedConversationControllers');

const router = express.Router()

router.post('/:id', createConversation)

router.get('/all', getUserConversations)

router.get('/:id', getConversation)

router.put('/message/:id', () => {})

module.exports = router