const express = require("express");
const axios = require("axios");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
const PORT = 5000;

app.use(cors());

let cookieval = "";

// Function to fetch NSE cookie using Puppeteer
async function refreshNseCookie() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-http2"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
    await page.goto("https://www.nseindia.com", { waitUntil: "networkidle2" });
    const cookies = await page.cookies();
    await browser.close();
    cookieval = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    console.log("NSE cookie refreshed!");
  } catch (err) {
    console.error("Failed to refresh NSE cookie:", err.message);
  }
}

// Refresh cookie on server start
refreshNseCookie();
// Refresh cookie every 30 minutes
setInterval(refreshNseCookie, 30 * 60 * 1000);

// ...existing code...
app.get("/api/heatmap/banknifty", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/heatmap-symbols?type=Sectoral%20Indices&indices=NIFTY%20BANK",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-market-indices/heatmap",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/heatmap/financenifty", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/heatmap-symbols?type=Sectoral%20Indices&indices=NIFTY%20FIN%20SERVICE",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-market-indices/heatmap",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/heatmap/nifty50", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/heatmap-symbols?type=Broad%20Market%20Indices&indices=NIFTY%2050",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-market-indices/heatmap",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/nifty50live", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/niftybanklive", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20BANK",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/niftyfinancelive", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20FINANCIAL%20SERVICES",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer:
            "https://www.nseindia.com/market-data/live-equity-market?symbol=NIFTY%2050",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          cookie: cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bselive", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.bseindia.com/BseIndiaAPI/api/GetLinknew/w?code=16",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
          Referer: "https://www.bseindia.com/",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          // 'cookie': cookieval,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh cookie on server start
refreshNseCookie().then(() => {
  // Start the server only after the cookie is set
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

