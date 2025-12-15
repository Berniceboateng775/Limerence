const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
