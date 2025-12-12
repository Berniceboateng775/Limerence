const express = require("express");
const router = express.Router();
const { searchBooks, getBookDetails } = require("../services/scraper");
const Book = require("../models/Book");
const commentRoutes = require("./comments");

// Mount comments routes
router.use("/:bookId/comments", commentRoutes);

// @route   GET /api/books/search
// @desc    Search for books (Scrape OceanofPDF or DB)
router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ msg: "Query required" });

  try {
    // 1. Try to find in DB first (optional, maybe just scrape for now)
    // const dbBooks = await Book.find({ title: { $regex: query, $options: "i" } });
    
    // 2. Scrape
    const scrapedBooks = await searchBooks(query);
    res.json({ books: scrapedBooks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/books/:id
// @desc    Get book details (Scrape details if needed)
router.get("/:id", async (req, res) => {
  try {
    let book = null;
    
    // Check if valid ObjectId (for DB books)
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        book = await Book.findById(req.params.id);
    }

    if (book) {
        return res.json(book);
    }

    // If not in DB, it might be a scraped "detailsUrl" passed as ID? 
    // Actually, frontend should pass the URL or we need a way to map.
    // For MVP, if we click a scraped book, we might need to "save" it to DB first 
    // or pass the URL to a specific endpoint to fetch details.
    
    // Let's assume the frontend sends a special "scrape" endpoint or we handle it here.
    // If the ID looks like a URL (encoded), scrape it.
    // But standard REST uses ID.
    
    // Strategy: When user clicks a scraped book, Frontend calls /api/books/details?url=...
    return res.status(404).json({ msg: "Book not found in DB" });

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
