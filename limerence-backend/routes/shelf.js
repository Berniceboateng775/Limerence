const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Book = require("../models/Book");
const { checkAndAwardBadge } = require("../utils/badgeUtils");

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

router.post("/add", auth, async (req, res) => {
      const { bookId, status } = req.body;
      
      try {
        const user = await User.findById(req.user.userId);
        const book = await Book.findById(bookId); // Need book details for genre

        // Check if already in shelf
        const exists = user.shelf.find(item => item.book.toString() === bookId);
        let justCompleted = false;

        if (exists) {
            if (status === "completed" && exists.status !== "completed") justCompleted = true;
            exists.status = status || exists.status;
        } else {
            user.shelf.push({ book: bookId, status: status || "want_to_read" });
            if (status === "completed") justCompleted = true;
        }

        let newBadge = null;

        if (justCompleted && book) {
            // 1. Increment Stats (Safely)
            if (!user.stats) user.stats = {};
            user.stats.booksRead = (user.stats.booksRead || 0) + 1;
            user.markModified('stats'); // Critical for Mixed/Subdoc modifications

            // 2. Check Read Count Badges
             const b1 = await checkAndAwardBadge(user, "read_count");
            if (b1) newBadge = b1;

            // 3. Check Genre Badges
            // Count completed books of this genre
            if (book.genres && book.genres.length > 0) {
                // We need to fetch user's full shelf populated to count genres (expensive but accurate)
                // Or we iterate the IDs if we don't have book objects... 
                // Better approach: We'll do a quick agg or filtered count if possible.
                // For now, let's fetch the shelf's book details.
                const fullUser = await User.findById(req.user.userId).populate("shelf.book");
                
                const completedBooks = fullUser.shelf.filter(i => i.status === "completed" && i.book);
                
                for (const genre of book.genres) {
                    const genreCount = completedBooks.filter(i => 
                        i.book.genres && i.book.genres.includes(genre)
                    ).length;

                    // Pass 'genreCount' + 1 (for current)? No, fullUser has updated shelf? 
                    // We just pushed to 'user', but 'fullUser' fetched from DB might not have the update if we didn't save yet.
                    // Let's save 'user' FIRST before complex checks? or rely on memory updates.
                    
                    // Actually, let's stick to memory updates for simple logic or save first.
                    // Simplest: Save current state, then do checks.
                }
            }
            
            // Simplified Genre Check (assuming memory state)
            // We'll rely on a manual counting helper for now or just check specific known genres
            if (book.genres) {
                 // Optimization: Save first to ensure data consistency for complex queries
            }

            // 4. Time-based Badges (Manual)
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 4) { // Night Owl: Read after midnight (00-04)
                 const b = await checkAndAwardBadge(user, "manual", { force: true }); 
                 // Wait, checkAndAwardBadge needs name or runs all manual?
                 // The helper filters by type. For manual, it checks if 'context.force' is true. 
                 // But multiple manuals exist. We need to specify WHICH manual badge.
                 // Refactor helper to accept specific name? Or pass context with logic.
                 // Let's manually push for these specific ones to save complexity.
                 if (!user.badges.some(b => b.name === "Night Owl")) {
                     const badge = { name: "Night Owl", icon: "🦉", description: "Read a book after midnight" };
                     user.badges.push(badge);
                     newBadge = badge;
                 }
            }
            if (hour >= 4 && hour < 8) { // Early Bird
                 if (!user.badges.some(b => b.name === "Early Bird")) {
                     const badge = { name: "Early Bird", icon: "☀️", description: "Read a book before 8 AM" };
                     user.badges.push(badge);
                     newBadge = badge;
                 }
            }
        }
        
        // Save first to persist shelf changes
        await user.save();

        // 5. Post-save Genre Check (Cleanest way)
        if (justCompleted && book) {
             const fullUser = await User.findById(req.user.userId).populate("shelf.book");
             const completed = fullUser.shelf.filter(i => i.status === "completed" && i.book);
             
             // Check each genre of the current book
             if (book.genres) {
                 for (const g of book.genres) {
                     const count = completed.filter(i => i.book.genres && i.book.genres.includes(g)).length;
                     // Map Genre names if needed (e.g. "Science Fiction" vs "Sci-Fi")
                     let normalizedGenre = g;
                     if (g === "Sci-Fi") normalizedGenre = "Science Fiction"; // Example
                     
                     const b = await checkAndAwardBadge(fullUser, "genre_count", { genre: normalizedGenre, count });
                     if (b) newBadge = b;
                 }
             }
             
             if (newBadge) {
                 await fullUser.save(); // Save again if badge awarded
                 // Return the FULL user with new badge
                 return res.json({ shelf: fullUser.shelf, badges: fullUser.badges, newBadge });
             }
             
             res.json({ shelf: fullUser.shelf, badges: fullUser.badges });
             return;
        }

        await user.populate("shelf.book");
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
