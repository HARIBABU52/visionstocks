import express from "express";
import axios from "axios";
import cors from "cors";
import puppeteer from "puppeteer";
//import { fetchAndStoreNifty50Points } from './database.js';

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
      timeout: 30000 // 30 seconds
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
    await page.goto("https://www.nseindia.com", { waitUntil: "networkidle2" });
    // Use browserContext.cookies instead of deprecated page.cookies
    const cookies = await page.browserContext().cookies();
    await browser.close();
    cookieval = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    console.log("NSE cookie refreshed!");
  } catch (err) {
    console.error("Failed to refresh NSE cookie:", err.message);
  }
}

// API to get heatmap data for Bank Nifty
app.get("/api/heatmap/banknifty", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// API to get heatmap data for Finance Nifty
app.get("/api/heatmap/financenifty", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// API to get heatmap data for Nifty 50
app.get("/api/heatmap/nifty50", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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

// API to get live data for Nifty 50
app.get("/api/nifty50live", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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

// API to get live data for Nifty Bank
app.get("/api/niftybanklive", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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

// API to get live data for Fin Nifty
app.get("/api/niftyfinancelive", async (_, res) => {
  if (!cookieval) {
    return res.status(503).json({ error: "NSE cookie not set. Please try again later." });
  }
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

// API to get live data from BSE
app.get("/api/bselive", async (_, res) => {
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

// API to get Bank Nifty points contribution
app.get("/api/bankniftypoints", async (_, res) => {
  try {
    const response = await axios.get(
      "https://intradayscreener.com/api/indices/indexcontributors/NIFTY%20BANK"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get Fin Nifty points contribution
app.get("/api/finniftypoints", async (_, res) => {
  try {
    const response = await axios.get(
      "https://intradayscreener.com/api/indices/indexcontributors/NIFTY_FIN_SERVICE"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get Nifty 50 points contribution
app.get("/api/nifty50points", async (_, res) => {
  try {
    const response = await axios.get(
      "https://intradayscreener.com/api/indices/indexcontributors/NIFTY%2050"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server only after the cookie is set and set up periodic refresh
(async () => {
  await refreshNseCookie();
  // Refresh cookie every 30 minutes
  setInterval(refreshNseCookie, 30 * 60 * 1000);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();

// Example: Call the function to fetch and store data
//fetchAndStoreNifty50Points();

