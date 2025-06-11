import sqlite3pkg from 'sqlite3';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

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
function insertNifty50Points(year, day, time, data) {
  const query = `INSERT INTO nifty50points (Year, Day, Time, Data) VALUES (?, ?, ?, ?)`;
  db.run(query, [year, day, time, JSON.stringify(data)], (err) => {
    if (err) {
      console.error('Error inserting data:', err);
    } else {
      console.log('Data inserted successfully.');
    }
  });
}

// Fetch data from API and store it in the database
function fetchAndStoreNifty50Points() {
  const localurl = 'http://localhost:5000';
  axios
    .get(`${localurl}/api/nifty50points`)
    .then((res) => {
      const data = res.data;

      // Get current date and time
      const now = new Date();
      const year = now.getFullYear();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const time = now.toTimeString().slice(0, 5); // HH:MM format

      // Insert data into the database
      insertNifty50Points(year, day, time, data);
    })
    .catch((err) => {
      console.error('Error fetching data from API:', err);
    });


}
fetchAndStoreNifty50Points();
console.log
// Export functions
export { insertNifty50Points };