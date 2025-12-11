import sqlite3pkg from 'sqlite3';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from "cors";

const sqlite3 = sqlite3pkg.verbose();

// Initialize the database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database initialized at', dbPath);
    db.run(`CREATE TABLE IF NOT EXISTS nifty50points (
      Year INTEGER,
      Month TEXT,
      DayNumber INTEGER,
      Day TEXT,
      Time TEXT,
      Data TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Table nifty50points is ready.');
      }
    });
  }
});

// Function to insert data into the database
function insertNifty50Points(year, day, time, month, dayNumber, data) {
  const query = `INSERT INTO nifty50points (Year, Day, Time, Month, DayNumber, Data) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [year, day, time, month, dayNumber, JSON.stringify(data)], (err) => {
    if (err) {
      console.error('Error inserting data:', err);
    } else {
      console.log('Data inserted successfully.');
    }
  });
}

// Fetch data from API and store it in the database
function fetchAndStoreNifty50Points() {
  // Convert current time to IST (Indian Standard Time)
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const dayOfWeek = istTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const currentHour = istTime.getHours();
  const currentMinute = istTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  
  // Market hours: Monday to Friday, 8:30 AM to 4:00 PM IST
  const marketOpenTime = 8 * 60 + 30; // 8:30 AM = 510 minutes
  const marketCloseTime = 16 * 60; // 4:00 PM = 960 minutes
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  const isMarketHours = currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime;

  // Stop inserting if not a weekday or outside market hours
  if (!isWeekday) {
    console.log('Market closed. Weekend detected. Data insertion skipped.');
    return;
  }

  if (!isMarketHours) {
    console.log('Market closed. Outside trading hours (8:30 AM - 4:00 PM IST). Data insertion skipped.');
    return;
  }

  const localurl = 'http://localhost:5000';
  axios
    .get(`${localurl}/api/nifty50points`)
    .then((res) => {
      const resd = res.data.data?.indexContributionList;
      

      if (!resd || !Array.isArray(resd)) {
        console.error('API response does not contain a valid indexContributionList array:', res.data);
        return;
      }

      const heavyWeightStocksSymbolList = [
        'HDFCBANK','ICICIBANK','RELIANCE','INFY','BHARTIARTL','LT','ITC','TCS','AXISBANK','KOTAKBANK','SBIN'
      ];

      // Filter response to only include heavy weight stocks
      const filteredData = resd.filter(item =>
        heavyWeightStocksSymbolList.includes(item.symbol)
      );

      // Get current date and time
      const now = new Date();
      const year = now.getFullYear();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const time = now.toTimeString().slice(0, 5); // HH:MM format
      const month = now.toLocaleDateString('en-US', { month: 'long' });
      const dayNumber = now.getDate();

      // Insert data into the database
      insertNifty50Points(year, day, time, month, dayNumber, filteredData);
    })
    .catch((err) => {
      console.error('Error fetching data from API:', err);
    });
}
fetchAndStoreNifty50Points();
setInterval(fetchAndStoreNifty50Points, 2 * 60 * 1000);
console.log('Data fetching initiated.');

// Function to get all data for a specific day (today)
function getTodayNifty50Points(callback) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const dayNumber = now.getDate();
  const query = `SELECT * FROM nifty50points WHERE Year = ? AND Month = ? AND DayNumber = ?`;
  db.all(query, [year, month, dayNumber], (err, rows) => {
    if (err) {
      console.error('Error fetching today\'s data:', err);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

// --- API to get today's nifty50points data from the database ---
const app = express();
app.use(cors());

app.get('/api/db/topstocks', (_, res) => {
  getTodayNifty50Points((err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    // Parse the Data field from string to JSON for each row
    const result = rows.map(row => ({
      ...row,
      Data: (() => {
        try {
          return JSON.parse(row.Data);
        } catch {
          return row.Data;
        }
      })()
    }));
    res.json(result);
  });
});



app.listen(5001, () => {
  console.log('Server running on port 5001');
});

export { insertNifty50Points, fetchAndStoreNifty50Points, getTodayNifty50Points };
