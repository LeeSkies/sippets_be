const mongoose = require("mongoose");

const Schema = mongoose.Schema

const MessageSchema = new Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  received: {
    type: Boolean,
    default: false,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

MessageSchema.methods.setRead = function () {
  this.read = true;
  this.save()
}

module.exports = mongoose.model("Message", MessageSchema);
