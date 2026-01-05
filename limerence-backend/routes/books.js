const express = require("express");
const router = express.Router();
const { searchGoogleBooks, getGoogleBookDetails } = require("../services/googleBooks");
const { getBookDetails } = require("../services/scraper"); // Keep scraper for download links ONLY
const Book = require("../models/Book");
const commentRoutes = require("./comments");

// Hardcover API Integration
const hardcover = require("../utils/hardcover");

// Mount comments routes
router.use("/:bookId/comments", commentRoutes);

// ============================================
// HARDCOVER API ENDPOINTS
// Uses Title Case matching for case-sensitive searches
// ============================================

// @route   GET /api/books/hardcover/search
// @desc    Search books using Hardcover (converts to Title Case)
router.get("/hardcover/search", async (req, res) => {
    const { q, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ msg: "Query required" });

    try {
        const books = await hardcover.searchBooks(q, parseInt(limit));
        res.json({ books, source: "hardcover" });
    } catch (err) {
        console.error("Hardcover search error:", err);
        res.status(500).json({ msg: "Search failed", error: err.message });
    }
});

// @route   GET /api/books/hardcover/enrich
// @desc    Try to find a book on Hardcover by exact title for enriched data
router.get("/hardcover/enrich", async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ msg: "Title required" });

    try {
        const book = await hardcover.findBookByTitle(title);
        if (!book) {
            return res.status(404).json({ msg: "Book not found on Hardcover", title });
        }
        res.json(book);
    } catch (err) {
        console.error("Hardcover enrich error:", err);
        res.status(500).json({ msg: "Failed to enrich book" });
    }
});

// @route   GET /api/books/hardcover/book/:id
// @desc    Get detailed book info from Hardcover by ID
router.get("/hardcover/book/:id", async (req, res) => {
    try {
        const book = await hardcover.getBookById(req.params.id);
        if (!book) return res.status(404).json({ msg: "Book not found" });
        res.json(book);
    } catch (err) {
        console.error("Hardcover book error:", err);
        res.status(500).json({ msg: "Failed to fetch book" });
    }
});

// @route   GET /api/books/hardcover/author/:id
// @desc    Get author info and all their books
router.get("/hardcover/author/:id", async (req, res) => {
    try {
        const author = await hardcover.getAuthorById(req.params.id);
        if (!author) return res.status(404).json({ msg: "Author not found" });
        res.json(author);
    } catch (err) {
        console.error("Hardcover author error:", err);
        res.status(500).json({ msg: "Failed to fetch author" });
    }
});

// @route   GET /api/books/hardcover/series/:id
// @desc    Get series with all books
router.get("/hardcover/series/:id", async (req, res) => {
    try {
        const series = await hardcover.getSeriesById(req.params.id);
        if (!series) return res.status(404).json({ msg: "Series not found" });
        res.json(series);
    } catch (err) {
        console.error("Hardcover series error:", err);
        res.status(500).json({ msg: "Failed to fetch series" });
    }
});

// @route   GET /api/books/hardcover/popular
// @desc    Get popular books (for homepage)
router.get("/hardcover/popular", async (req, res) => {
    const { limit = 30 } = req.query;
    try {
        const books = await hardcover.getPopularBooks(parseInt(limit));
        res.json({ books, source: "hardcover" });
    } catch (err) {
        console.error("Hardcover popular error:", err);
        res.status(500).json({ msg: "Failed to fetch popular books" });
    }
});

// ============================================
// LEGACY ENDPOINTS (Google Books Fallback)
// ============================================

// @route   GET /api/books/search
// @desc    Search for books (Google Books API - Legacy)
router.get("/search", async (req, res) => {
  let { query, startIndex = 0, orderBy = "relevance" } = req.query;
  if (!query) return res.status(400).json({ msg: "Query required" });

  // Smart Query Refinement for "Gen Z" content
  const lowerQ = query.toLowerCase();
  
  // 1. Fix "High School" / "College" -> Add "romance fiction"
  if (lowerQ === "high school" || lowerQ === "college" || lowerQ === "office") {
      query += " romance fiction";
  }
  
  // 2. Fix "Romance" generic -> Target "New Adult" or "BookTok"
  if (lowerQ === "romance") {
      query = "subject:romance new adult -erotica"; // Filter explicit if needed, or just better keywords
      orderBy = "newest";
  }

  // 3. Fix "Trending" -> If query is "trending", use curated list
  if (lowerQ === "trending") {
      const trends = ["BookTok", "Colleen Hoover", "Sarah J Maas", "Rebecca Yarros", "dark romance", "enemies to lovers"];
      query = trends[Math.floor(Math.random() * trends.length)];
      orderBy = "relevance";
  }

  try {
    // Search Google Books
    const books = await searchGoogleBooks(query, startIndex, 20, orderBy);
    res.json({ books });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/books/lookup
// @desc    Check if book exists in DB by External ID or Title (Smart Sync)
router.get("/lookup", async (req, res) => {
    const { externalId, title } = req.query;
    if (!externalId) return res.status(400).json({ msg: "External ID required" });

    try {
        // 1. Try exact match by External ID
        let book = await Book.findOne({ externalId });
        if (book) return res.json(book);

        // 2. Fallback: Try matching by Title (for legacy books without externalId)
        if (title) {
            // Case-insensitive exact match
            book = await Book.findOne({ title: new RegExp(`^${title}$`, 'i') });
            if (book) {
                // Self-heal: Save the externalId so next lookup is fast
                book.externalId = externalId;
                await book.save();
                return res.json(book);
            }
        }

        return res.status(404).json({ msg: "Book not found in DB" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/books/:id
// @desc    Get book details (DB or Google Books)
router.get("/:id", async (req, res) => {
  try {
    let book = null;
    
    // 1. Valid MongoDB ID? Check DB first.
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        book = await Book.findById(req.params.id);
        if (book) return res.json(book);
    }

    // 2. Not in DB or not an ID? Fetch from Google Books
    // (The ID passed from frontend search results will be the Google ID)
    const googleDetails = await getGoogleBookDetails(req.params.id);
    if (googleDetails) {
        // We return the details directly. 
        // If we want to persist it, we can save it here, but maybe wait until user "Adds to Shelf".
        return res.json(googleDetails);
    }

    return res.status(404).json({ msg: "Book not found" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/books/details
// @desc    Get details from URL (Scraper) and optionally save to DB
router.post("/details", async (req, res) => {
    const { url, title, author, cover } = req.body;
    if (!url) return res.status(400).json({ msg: "URL required" });

    try {
        // Check if we already have this book saved by externalId or URL
        let book = await Book.findOne({ downloadUrl: url }); // Weak check, but okay for MVP
        if (book) return res.json(book);

        const details = await getBookDetails(url);
        if (!details) return res.status(404).json({ msg: "Could not scrape details" });

        // We don't necessarily save it yet, just return details.
        // Or we can save it as a "cached" book.
        // Let's return the combined data.
        res.json({
            title,
            authors: [author],
            coverImage: cover,
            description: details.description,
            downloadUrl: details.downloadUrl, // The actual file link
            sourceUrl: url
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/books/:id/rate
// @desc    Rate a book
router.post("/:id/rate", async (req, res) => {
    try {
        const { rating } = req.body;
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ msg: "Book not found" });

        // Simple rating logic: just push to an array or update average
        // For MVP, let's add a ratings array to the Book model if it doesn't exist
        // Or just store it in the book object.
        // Let's assume Book model has `ratings` array of numbers.
        // If not, we should update Book model. 
        // Let's check Book model first? No, let's just push and see.
        // Actually, better to update Book model to support ratings.
        
        if (!book.ratings) book.ratings = [];
        book.ratings.push(rating);
        
        // Calculate average
        const sum = book.ratings.reduce((a, b) => a + b, 0);
        book.averageRating = (sum / book.ratings.length).toFixed(1);
        
        await book.save();
        res.json(book);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/books
// @desc    Save a book to DB (when adding to shelf)
router.post("/", async (req, res) => {
    try {
        const { title, authors, description, coverImage, downloadUrl, source } = req.body;
        
        // Check if exists
        let book = await Book.findOne({ title, "authors.0": authors[0] });
        if (book) return res.json(book);

        book = new Book({
            title,
            authors,
            description,
            coverImage,
            downloadUrl,
            source
        });

        await book.save();
        res.json(book);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
