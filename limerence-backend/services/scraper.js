const axios = require("axios");
const cheerio = require("cheerio");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const searchOceanofPDF = async (query) => {
  console.log(`Searching OceanofPDF for: ${query}`);
  try {
    // Fetch 2 pages in parallel for speed
    const pages = [1, 2];
    const promises = pages.map(page => 
        axios.get(`https://oceanofpdf.com/page/${page}/?s=${encodeURIComponent(query)}`, {
            headers: {
                "User-Agent": getRandomUserAgent(),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            },
            timeout: 10000 // 10s timeout per request
        }).catch(e => null) // Catch individual errors so one failure doesn't kill all
    );

    const responses = await Promise.all(promises);
    const books = [];

    responses.forEach((response, index) => {
        if (!response || !response.data) return;
        
        const $ = cheerio.load(response.data);
        $("article").each((i, el) => {
            const title = $(el).find(".title").text().trim() || $(el).find("h2.entry-title a").text().trim();
            const detailsUrl = $(el).find("a").attr("href");
            const coverImage = $(el).find("img").attr("src") || $(el).find("img").attr("data-lazy-src");
            
            let author = "Unknown Author";
            const authorText = $(el).find(".author").text().trim();
            if (authorText) author = authorText;

            if (title && detailsUrl) {
                // Avoid duplicates
                if (!books.some(b => b.externalId === detailsUrl)) {
                    books.push({
                        title,
                        authors: [author],
                        description: "Click to view details and download.", 
                        coverImage: coverImage || "https://via.placeholder.com/150",
                        downloadUrl: detailsUrl, 
                        source: "oceanofpdf",
                        externalId: detailsUrl 
                    });
                }
            }
        });
    });

    console.log(`Found ${books.length} books on OceanofPDF`);
    return books;

  } catch (err) {
    console.error("OceanofPDF Scraping Error:", err.message);
    return [];
  }
};

const searchOpenLibrary = async (query) => {
  try {
    const res = await axios.get(`http://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
    const docs = res.data.docs.slice(0, 10); // Limit to 10
    return docs.map(doc => ({
      title: doc.title,
      authors: doc.author_name || ["Unknown"],
      description: "From OpenLibrary",
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : "https://via.placeholder.com/150",
      downloadUrl: null, // OpenLibrary doesn't provide direct downloads usually
      source: "openlibrary",
      externalId: doc.key
    }));
  } catch (err) {
    console.error("OpenLibrary Error:", err.message);
    return [];
  }
};

const searchBooks = async (query) => {
  // Try OceanofPDF first
  let books = await searchOceanofPDF(query);
  
  // If we have fewer than 10 books, try OpenLibrary to supplement
  if (books.length < 10) {
    console.log("Supplementing with OpenLibrary...");
    const olBooks = await searchOpenLibrary(query);
    books = [...books, ...olBooks];
  }

  return books;
};

const getBookDetails = async (url) => {
    if (!url.includes("oceanofpdf.com")) return null;

    try {
        const { data } = await axios.get(url, {
            headers: { "User-Agent": getRandomUserAgent() }
        });
        const $ = cheerio.load(data);

        const title = $(".entry-title").text().trim();
        
        // Improved description extraction
        let description = "";
        $(".entry-content p").each((i, el) => {
            const text = $(el).text().trim();
            // Filter out metadata lines
            if (text && !text.includes("Download") && !text.includes("Copyright") && !text.includes("Pages") && !text.includes("Format") && description.length < 800) {
                description += text + "\n\n";
            }
        });
        
        const coverImage = $(".entry-content img").first().attr("src");
        
        // Robust download link extraction
        let downloadUrl = null;
        
        // Method 1: Look for forms with specific actions (often used for PDF/EPUB buttons)
        $("form").each((i, el) => {
            const action = $(el).attr("action");
            if (action && (action.includes("pdf") || action.includes("epub"))) {
                downloadUrl = action;
                return false;
            }
        });

        // Method 2: Look for direct links if Method 1 failed
        if (!downloadUrl) {
             $("a").each((i, el) => {
                const href = $(el).attr("href");
                const text = $(el).text().toLowerCase();
                if (href && (href.includes(".pdf") || href.includes(".epub")) && (text.includes("download") || text.includes("pdf"))) {
                    downloadUrl = href;
                    return false; 
                }
            });
        }

        return {
            title,
            description: description || "No description available.",
            coverImage,
            downloadUrl
        };

    } catch (err) {
        console.error("Error fetching book details:", err.message);
        return null;
    }
}

module.exports = { searchBooks, getBookDetails };
