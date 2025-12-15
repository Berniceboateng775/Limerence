const axios = require("axios");

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

const searchGoogleBooks = async (query, startIndex = 0, maxResults = 20, orderBy = "relevance") => {
  try {
    // Enhance query for better results (e.g. relevance, newest for trends)
    // For specific genres like "romance", we can add subject:romance
    const res = await axios.get(GOOGLE_BOOKS_API_URL, {
      params: {
        q: query,
        startIndex,
        maxResults,
        printType: "books",
        orderBy // "relevance" or "newest"
      }
    });

    if (!res.data.items) return [];

    return res.data.items.map(item => {
      const info = item.volumeInfo;
      return {
        _id: item.id, // Use Google's ID as a temporary ID
        title: info.title,
        authors: info.authors || ["Unknown Author"],
        description: info.description || "No description available.",
        coverImage: info.imageLinks?.thumbnail?.replace("http:", "https:") || "",
        averageRating: info.averageRating || 0,
        publishedDate: info.publishedDate,
        externalId: item.id, // Explicitly store Google ID
        source: "google"
      };
    });
  } catch (err) {
    console.error("Google Books Search Error:", err.message);
    return [];
  }
};

const getGoogleBookDetails = async (googleID) => {
  try {
    const res = await axios.get(`${GOOGLE_BOOKS_API_URL}/${googleID}`);
    const info = res.data.volumeInfo;
    
    return {
        _id: res.data.id,
        title: info.title,
        authors: info.authors || ["Unknown Author"],
        description: info.description || "",
        coverImage: info.imageLinks?.thumbnail?.replace("http:", "https:") || info.imageLinks?.large?.replace("http:", "https:") || "",
        averageRating: info.averageRating || 0,
        pageCount: info.pageCount,
        categories: info.categories,
        publishedDate: info.publishedDate,
        previewLink: info.previewLink, // Good for "Read Online"
        infoLink: info.infoLink,
        externalId: res.data.id,
        source: "google"
    };
  } catch (err) {
    console.error("Google Books Details Error:", err.message);
    return null;
  }
};

module.exports = { searchGoogleBooks, getGoogleBookDetails };
