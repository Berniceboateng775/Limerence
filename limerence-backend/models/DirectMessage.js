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
    // Support both string URL and object with fileType/url/name
    attachment: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    attachmentType: {
      type: String,
      enum: ["image", "video", "audio", "voice", "file", "location", "none"], // Extended types
      default: "none"
    },
    isRead: {
      type: Boolean,
      default: false
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
    },
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isForwarded: {
      type: Boolean,
      default: false
    },
    // Support object with userId, username, originalMsgId
    forwardedFrom: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Pinned status on individual message
    pinned: {
      type: Boolean,
      default: false
    }
  }],
  // Track when each participant last read the conversation
  lastReadBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastReadAt: { type: Date, default: Date.now }
  }],
  // Pinned message
  pinnedMessage: {
    type: mongoose.Schema.Types.ObjectId
  },
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
