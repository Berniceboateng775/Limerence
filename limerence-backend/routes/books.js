const express = require("express");
const router = express.Router();
const { searchGoogleBooks, getGoogleBookDetails } = require("../services/googleBooks");
const { getBookDetails } = require("../services/scraper"); // Keep scraper for download links ONLY
const Book = require("../models/Book");
const commentRoutes = require("./comments");

// Mount comments routes
router.use("/:bookId/comments", commentRoutes);

// @route   GET /api/books/search
// @desc    Search for books (Google Books API)
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
