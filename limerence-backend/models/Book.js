const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true,
  },
  authors: [String],
  description: String,
  coverImage: String,
  downloadUrl: String, // URL to the PDF/EPUB
  source: {
    type: String,
    enum: ["oceanofpdf", "openlibrary", "manual"],
    default: "manual",
  },
  externalId: String, // ID from the source (if applicable)
  genres: [String],
  ratings: [Number],
  averageRating: {
    type: Number,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Book || mongoose.model("Book", BookSchema);
