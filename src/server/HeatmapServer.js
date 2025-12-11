import express from "express";
import axios from "axios";
import cors from "cors";
import puppeteer from "puppeteer";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// __dirname is not defined in ES modules; derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//import { fetchAndStoreNifty50Points } from './database.js';

const app = express();
const PORT = 5000;

app.use(cors());


let cookieval = "";
// Track detected Chrome/Chromium executable path for logging
let detectedChromePath = null;

// Function to fetch NSE cookie using Puppeteer
async function refreshNseCookie() {
  try {
    // Configure Puppeteer with proper cache and fallback paths
    const puppeteerConfig = {
      headless: true,
      args: ["--disable-http2", "--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 30000 // 30 seconds
    };

    // Try to locate a Chrome/Chromium executable automatically.
    function findChromeExecutable() {
      // Allow explicit override via env
      const explicit = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
      if (explicit && fs.existsSync(explicit)) return explicit;

      // 1) If puppeteer package has an executablePath() helper, prefer that (node-installed chromium)
      try {
        if (puppeteer && typeof puppeteer.executablePath === 'function') {
          const pExec = puppeteer.executablePath();
          if (pExec && fs.existsSync(pExec)) return pExec;
        }
      } catch (e) {
        // ignore
      }

      // 2) Look for puppeteer's local chromium inside node_modules (common when build/install added browsers)
      try {
        const localChromiumBase = path.join(process.cwd(), 'node_modules', 'puppeteer', '.local-chromium');
        const candidates = ['chrome', 'chrome.exe', 'chromium', 'chromium-browser', 'chrome-win64'];
        if (fs.existsSync(localChromiumBase)) {
          const entries = fs.readdirSync(localChromiumBase);
          for (const e of entries) {
            const full = path.join(localChromiumBase, e);
            if (!fs.existsSync(full)) continue;
            // search one level and a couple common subpaths
            const tryPaths = [full, path.join(full, 'chrome'), path.join(full, 'chrome-win64')];
            for (const tp of tryPaths) {
              if (!fs.existsSync(tp)) continue;
              for (const cand of candidates) {
                const exe = path.join(tp, cand);
                if (fs.existsSync(exe)) return exe;
              }
              // also inspect files inside
              const subEntries = fs.readdirSync(tp).map(s => path.join(tp, s));
              for (const sfull of subEntries) {
                for (const cand2 of candidates) {
                  const ex = path.join(sfull, cand2);
                  if (fs.existsSync(ex)) return ex;
                }
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // 3) Fall back to user/cache locations (Render, HOME, USERPROFILE)
      const cacheDirs = [];
      if (process.env.PUPPETEER_CACHE_DIR) cacheDirs.push(process.env.PUPPETEER_CACHE_DIR);
      // Render's default cache path
      cacheDirs.push('/opt/render/.cache/puppeteer');
      // Local user cache fallback
      if (process.env.HOME) cacheDirs.push(path.join(process.env.HOME, '.cache', 'puppeteer'));
      if (process.env.USERPROFILE) cacheDirs.push(path.join(process.env.USERPROFILE, '.cache', 'puppeteer'));

      const fallbackCandidates = ['chrome', 'chrome.exe', 'chromium', 'chromium-browser'];
      for (const base of cacheDirs) {
        try {
          if (!fs.existsSync(base)) continue;
          const entries = fs.readdirSync(base);
          for (const e of entries) {
            const full = path.join(base, e);
            // search one level deep for executables
            if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
              // look for known executable names inside
              for (const cand of fallbackCandidates) {
                const exe1 = path.join(full, cand);
                const exe2 = path.join(full, 'chrome-' + cand);
                const exe3 = path.join(full, 'chrome', cand);
                const exe4 = path.join(full, 'chrome-win64', cand);
                if (fs.existsSync(exe1)) return exe1;
                if (fs.existsSync(exe2)) return exe2;
                if (fs.existsSync(exe3)) return exe3;
                if (fs.existsSync(exe4)) return exe4;
                // recursive one more level
                const sub = fs.readdirSync(full).map(s => path.join(full, s));
                for (const sfull of sub) {
                  for (const cand2 of fallbackCandidates) {
                    const ex = path.join(sfull, cand2);
                    if (fs.existsSync(ex)) return ex;
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore permission errors
        }
      }
      return null;
    }

    const detected = findChromeExecutable();
    if (detected) {
      puppeteerConfig.executablePath = detected;
      detectedChromePath = detected;
      console.log('Puppeteer will use executable at', detected);
    } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      detectedChromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log('Using PUPPETEER_EXECUTABLE_PATH from env:', process.env.PUPPETEER_EXECUTABLE_PATH);
    }
    else {
      // Attempt a one-time runtime install of Puppeteer's Chrome if not found
      try {
        console.log('No Chrome executable detected. Attempting runtime install of Puppeteer browsers...');
        // Use dynamic import for child_process in ESM context
        const { execSync } = await import('child_process');
        execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
        const detectedAfter = findChromeExecutable();
        if (detectedAfter) {
          puppeteerConfig.executablePath = detectedAfter;
          detectedChromePath = detectedAfter;
          console.log('Puppeteer detected Chrome after runtime install at', detectedAfter);
        } else {
          console.warn('Runtime install completed but Chrome executable still not detected.');
          // Final fallback: install chrome-launcher package and try to use it
          try {
            console.log('Final fallback: installing chrome-launcher npm package...');
            execSync('npm install chrome-launcher', { stdio: 'inherit' });
            // Try to launch Chrome via chrome-launcher to get the executable path
            const chromeLauncher = (await import('chrome-launcher')).default;
            const launchResult = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
            if (launchResult && launchResult.executablePath) {
              puppeteerConfig.executablePath = launchResult.executablePath;
              detectedChromePath = launchResult.executablePath;
              console.log('Chrome launcher found Chrome at:', launchResult.executablePath);
              await chromeLauncher.kill(launchResult.pid);
            }
          } catch (fallbackErr) {
            console.warn('Chrome launcher fallback failed:', fallbackErr && fallbackErr.message);
          }
        }
      } catch (e) {
        console.warn('Runtime Puppeteer browser install failed:', e && e.message);
      }
    }

    // On Render (and similar environments), explicitly set the cache directory
    if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
      puppeteerConfig.cacheDirectory = '/opt/render/.cache/puppeteer';
    }

    const browser = await puppeteer.launch(puppeteerConfig);
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
    console.log("NSE cookie refreshed successfully!");
  } catch (err) {
    console.error("Failed to refresh NSE cookie:", err.message);
    console.warn("Continuing without NSE cookie. Some APIs may be limited. Cookie will retry every 30 minutes.");
  }
}

// API to get heatmap data for Bank Nifty
app.get("/api/heatmap/banknifty", async (_, res) => {
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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
  // If no cookie, try without it or return graceful error
  if (!cookieval) {
    console.warn("Warning: NSE cookie not set, attempting request anyway...");
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

// Serve React build (production) if available
const buildPath = path.resolve(__dirname, "../../build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  // Fallback: serve index.html for client-side routing
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Start the server only after the cookie is set and set up periodic refresh
(async () => {
  await refreshNseCookie();
  // Refresh cookie every 30 minutes
  setInterval(refreshNseCookie, 30 * 60 * 1000);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Detected Chrome path:', detectedChromePath || 'none');
  });
})();

// Example: Call the function to fetch and store data
//fetchAndStoreNifty50Points();

