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

// Helper: Define Milestones
const BADGE_DEFINITIONS = [
    // Reading Milestones
    { name: "Bookworm", icon: "📚", desc: "Read your first book", type: "read_count", threshold: 1 },
    { name: "Page Turner", icon: "📖", desc: "Read 5 books", type: "read_count", threshold: 5 },
    { name: "Bibliophile", icon: "🤓", desc: "Read 10 books", type: "read_count", threshold: 10 },
    { name: "Library Dweller", icon: "🏛️", desc: "Read 25 books", type: "read_count", threshold: 25 },
    { name: "Book Hoarder", icon: "📔", desc: "Read 50 books", type: "read_count", threshold: 50 },
    { name: "Literary Legend", icon: "👑", desc: "Read 100 books", type: "read_count", threshold: 100 },

    // Genre (Placeholder logic for now)
    { name: "Hopeless Romantic", icon: "💘", desc: "Read 5 Romance books" },
    { name: "Fantasy Explorer", icon: "�", desc: "Read 5 Fantasy books" },
    { name: "Detective", icon: "🕵️‍♀️", desc: "Read 5 Mystery books" }
];

// @route   POST /api/shelf/add
// @desc    Add book to shelf
router.post("/add", auth, async (req, res) => {
  const { bookId, status } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if already in shelf
    const exists = user.shelf.find(item => item.book.toString() === bookId);
    if (exists) {
        exists.status = status || exists.status;
    } else {
        user.shelf.push({ book: bookId, status: status || "want_to_read" });
    }

    let newBadge = null;

    if (status === "completed") {
        // Calculate completed count
        const completedCount = user.shelf.filter(i => i.status === "completed").length;
        
        // Check for new badges (Type: read_count)
        const readingBadges = BADGE_DEFINITIONS.filter(b => b.type === "read_count");
        
        readingBadges.forEach(def => {
            if (completedCount >= def.threshold) {
                const hasBadge = user.badges.some(b => b.name === def.name);
                if (!hasBadge) {
                    const badge = {
                        name: def.name,
                        description: def.desc,
                        icon: def.icon,
                        earnedAt: new Date()
                    };
                    user.badges.push(badge);
                    
                    // Award the highest tier or just the latest? 
                    // Let's return the latest earned one for the notification.
                    newBadge = badge;
                }
            }
        });
    }

    await user.save();
    // Populate to return full object
    await user.populate("shelf.book");
    
    // Return shelf, badges, AND any NEW badge to trigger the modal
    res.json({ shelf: user.shelf, badges: user.badges, newBadge }); 
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
