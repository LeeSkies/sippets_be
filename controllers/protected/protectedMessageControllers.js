const Conversation = require("../../models/conversationModel")
const Message = require("../../models/messageModel")
const User = require("../../models/userModel")

const getMessages = async (userId, conversationId, offset = 0) => {
  
    try {
      if (!conversationId || userId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
  
      const conversation = await Conversation.findById(conversationId);
  
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
  
      const limit = 20;
      const skip = offset ? parseInt(offset) : 0;
  
      const messages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(20)
        .exec();
  
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error });
    }
  };
  
const addMessage = async (conversationId, sender, content) => {
  
    try {
      if (!conversationId || !sender || !content) {
        throw Error('Missing required parameters');
      }
  
      const conversation = await Conversation.findById(conversationId);
  
      if (!conversation) {
        throw Error('Conversation not found');
      }
  
      if (!conversation.participants.includes(sender)) {
        throw Error('Invalid participants');
      }
  
      const message = await Message.create({ content, conversation: conversationId, sender, received: true, read: false })
    
      return message;
    } catch (error) {
      console.log(error)
    }
  };

  module.exports = {
    addMessage
  }
