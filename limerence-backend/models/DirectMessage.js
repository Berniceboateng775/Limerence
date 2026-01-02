const mongoose = require("mongoose");

const DirectMessageSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      default: ""
    },
    attachment: {
      type: String, // URL to uploaded file (image or voice note)
      default: ""
    },
    attachmentType: {
      type: String,
      enum: ["image", "voice", "none"],
      default: "none"
    },
    reactions: [{
      emoji: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    replyTo: {
      messageId: String,
      content: String,
      username: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient lookups
DirectMessageSchema.index({ participants: 1 });

module.exports = mongoose.model("DirectMessage", DirectMessageSchema);
