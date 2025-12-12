const express = require("express");
const router = express.Router({ mergeParams: true }); // Merge params to access :bookId
const auth = require("../middleware/auth");
const Comment = require("../models/Comment");
const Book = require("../models/Book");

// @route   GET /api/books/:bookId/comments
// @desc    Get comments for a book
// @access  Public
router.get("/", async (req, res) => {
  try {
    const comments = await Comment.find({ book: req.params.bookId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/books/:bookId/comments
// @desc    Add a comment to a book
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) {
      return res.status(404).json({ msg: "Book not found" });
    }

    const newComment = new Comment({
      user: req.user.userId,
      book: req.params.bookId,
      content: req.body.content,
    });

    const comment = await newComment.save();
    // Populate user details for immediate display
    await comment.populate("user", "name avatar");

    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
