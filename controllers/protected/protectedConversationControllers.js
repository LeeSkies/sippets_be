const Conversation = require("../../models/conversationModel")
const Message = require("../../models/messageModel")
const User = require("../../models/userModel")

const createConversation = async (req, res) => {
  const { user } = req
  const { id: recipientId } = req.params
  try {
    const recipient = await User.findById(recipientId).select('username image')

    if (!recipient) return res.status(404).json({ message: 'Not Found' })

    const conversation = await Conversation.create({ participants: [ user._id, recipientId ] })
    conversation.participants = [recipient, { _id: user._id, username: user.username, image: user.image }]
    res.json(conversation)
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ message: "Couldn't create conversation" })
  }
}

const getConversation = async (req, res) => {
    const { id: conversationId } = req.params;
    const { offset = 0 } = req.query
  
    try {
      if (!conversationId) {
        return res.status(400).json({ message: 'Missing conversation ID' });
      }
  
      const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(offset * 20)
      .limit(20)
  
      res.status(200).json(messages);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'An error occurred', error });
    }
  };

  const getUserConversations = async (req, res) => {
    const { user } = req;
  
    try {
      const conversations = await Conversation.find({ participants: { $in: user._id } })
      .populate({
        path: 'participants',
        select: 'username image'
      })
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred', error });
    }
  };
  
module.exports = {
  createConversation,
  getConversation,
  getUserConversations
}