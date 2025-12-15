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

// @route   POST /api/books/:bookId/comments/:commentId/like
// @desc    Like a comment
router.post("/:commentId/like", auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: "Comment not found" });

        // Check if already liked
        if (comment.likes.includes(req.user.userId)) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== req.user.userId);
        } else {
            // Like and remove dislike if exists
            comment.likes.push(req.user.userId);
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== req.user.userId);
        }
        await comment.save();
        res.json(comment.likes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/books/:bookId/comments/:commentId/dislike
// @desc    Dislike a comment
router.post("/:commentId/dislike", auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: "Comment not found" });

        // Check if already disliked
        if (comment.dislikes.includes(req.user.userId)) {
            // Remove dislike
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== req.user.userId);
        } else {
            // Dislike and remove like if exists
            comment.dislikes.push(req.user.userId);
            comment.likes = comment.likes.filter(id => id.toString() !== req.user.userId);
        }
        await comment.save();
        res.json(comment.dislikes);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/books/:bookId/comments/:commentId/reply
// @desc    Reply to a comment
router.post("/:commentId/reply", auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ msg: "Comment not found" });

        const newReply = {
            user: req.user.userId,
            content: req.body.content
        };

        comment.replies.push(newReply);
        await comment.save();
        
        // Populate user info for the new reply
        await comment.populate("replies.user", "name avatar");
        
        res.json(comment.replies);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
