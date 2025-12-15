const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Book = require("../models/Book");

// @route   GET /api/shelf
// @desc    Get user's shelf
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("shelf.book");
    res.json(user.shelf);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/shelf/add
// @desc    Add book to shelf
router.post("/add", auth, async (req, res) => {
  const { bookId, status } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if already in shelf
    const exists = user.shelf.find(item => item.book.toString() === bookId);
    if (exists) {
        // Update status if exists
        exists.status = status || exists.status;
    } else {
        user.shelf.push({ book: bookId, status: status || "want_to_read" });
    }

    if (status === "completed") {
        const badgeName = "Bookworm";
        const hasBadge = user.badges.some(b => b.name === badgeName);
        
        if (!hasBadge) {
            user.badges.push({
                name: badgeName,
                description: "You've completed a book! Keep reading to earn more.",
                icon: "📚"
            });
        }
    }

    await user.save();
    // Populate to return full object
    await user.populate("shelf.book");
    
    res.json({ shelf: user.shelf, badges: user.badges }); // Return badges too
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/shelf/remove
// @desc    Remove book from shelf
router.post("/remove", auth, async (req, res) => {
  const { bookId } = req.body;
  try {
    const user = await User.findById(req.user.userId);
    user.shelf = user.shelf.filter(item => item.book.toString() !== bookId);
    await user.save();
    res.json(user.shelf);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
