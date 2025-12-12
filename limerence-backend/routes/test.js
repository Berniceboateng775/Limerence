const axios = require("axios");
const cheerio = require("cheerio");

(async () => {
  try {
    const url = "https://theoceanofpdf.com/?s=romance";
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    console.log("Status:", response.status);
    console.log(response.data.substring(0, 500)); // print first 500 chars of the page
  } catch (error) {
    console.error("Error fetching:", error.message);
  }
})();
