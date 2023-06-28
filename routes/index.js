const express = require('express');

const router = express.Router();

const authenticateToken = require('../middleware/authenticateToken')

const publicUserRoutes = require('./public/publicUserRoutes');
const protectedUserRoutes = require('./protected/protectedUserRoutes');
const publicSippetRoutes = require('./public/publicSippetRoutes');
const protectedSippetRoutes = require('./protected/protectedSippetRoutes');
const buzzRoutes = require('./protected/buzzRoutes')
const protectedConversationRoutes = require('./protected/protectedConversationRoutes')
const searchRoutes = require('./public/searchRoutes')

router.use('/public/user', publicUserRoutes);
router.use('/public/sippet', publicSippetRoutes);
router.use('/public/search', searchRoutes);
router.use('/protected/user', authenticateToken, protectedUserRoutes);
router.use('/protected/sippet', authenticateToken, protectedSippetRoutes);
router.use('/protected/buzz', authenticateToken, buzzRoutes)
router.use('/protected/conversation', authenticateToken, protectedConversationRoutes);

module.exports = router