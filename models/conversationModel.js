const mongoose = require("mongoose");

const Schema = mongoose.Schema

const ConversationSchema = new Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
  ],
  unreadCount: {
    type: Number,
    default: 0
  }
}, { timestamps : true });

module.exports = mongoose.model("Conversation", ConversationSchema);
