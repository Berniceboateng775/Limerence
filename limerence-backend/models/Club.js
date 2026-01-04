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
  // Users who have been kicked and cannot rejoin
  bannedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  coverImage: String, // URL to club profile picture
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
      attachmentType: {
        type: String,
        enum: ["image", "video", "audio", "voice", "file", "location", "none"],
        default: "none"
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
      poll: {
          question: String,
          options: [
              {
                  text: String,
                  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
              }
          ]
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Club || mongoose.model("Club", ClubSchema);
