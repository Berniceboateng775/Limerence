const mongoose = require("mongoose");

const ClubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  // Track per-member stats (Unread counts)
  memberStats: [
      {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          lastReadAt: { type: Date, default: Date.now }
      }
  ],
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  currentBook: {
    title: String,
    author: String,
    coverImage: String,
  },
  messages: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      content: String,
      attachment: {
        fileType: String, // 'image', 'file', 'audio'
        url: String,
        name: String
      },
      // New Features
      replyTo: {
          id: String,
          username: String,
          content: String
      },
      reactions: [
          {
              user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              emoji: String
          }
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Club || mongoose.model("Club", ClubSchema);
