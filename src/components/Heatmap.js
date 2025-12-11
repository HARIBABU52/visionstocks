import { useEffect, useState } from "react";
import axios from "axios";
import "./Heatmap.css";
import Graphs from  "./graphs.js";
import React from 'react';
import ReactDOM from 'react-dom';



function getBgColor(pChange) {
  const p = parseFloat(pChange);
  if (p >= 2) return "#06a04a"; // dark green
  if (p >= 1) return "#22bb55"; // medium green
  if (p > 0) return "#90ee90"; // light green
  if (p > -1) return "#ffb3b3"; // light red
  if (p > -2) return "#ff6666"; // medium red
  return "#b22222"; // dark red
}

// Use this variable everywhere instead of hardcoding localhost
const localurl ='http://localhost:5000';
console.log(process.env.REACT_APP_API_URL,"rul")

const BSE30_SYMBOLS = [
  "RELIANCE",
  "HDFCBANK",
  "TCS",
  "BHARTIARTL",
  "ICICIBANK",
  "SBIN",
  "INFY",
  "BAJFINANCE",
  "HINDUNILVR",
  "ITC",
  "LT",
  "HCLTECH",
  "KOTAKBANK",
  "SUNPHARMA",
  "MARUTI",
  "M&M",
  "AXISBANK",
  "ULTRACEMCO",
  "NTPC",
  "BAJAJFINSV",
  "TITAN",
  "ADANIPORTS",
  "POWERGRID",
  "TATAMOTORS",
  "ETERNAL",
  "NESTLEIND",
  "ASIANPAINT",
  "TATASTEEL",
  "TECHM",
  "INDUSINDBK",
];

// Reusable banner component
function NiftyIndexBanner({ api, color = "#ff9800" }) {
  const [index, setIndex] = useState(null);

  useEffect(() => {
    // Always fetch once on load
    axios
      .get(api)
      .then((res) => {
        const obj = res.data?.data?.find((d) => d.priority === 1);
        setIndex(obj);
      })
      .catch(() => setIndex(null));

    const fetchData = () => {
      // Get current time in IST
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (5.5 * 60 * 60 * 1000));
      const day = ist.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
      const hour = ist.getHours();
      const minute = ist.getMinutes();

      // Only run on Monday (1) to Friday (5), and between 8:30 and 16:00 IST
      const isMarketDay = day >= 1 && day <= 5;
      const isMarketTime =
        (hour > 8 && hour < 16) ||
        (hour === 8 && minute >= 30) ||
        (hour === 16 && minute === 0);

      if (isMarketDay && isMarketTime) {
        axios
          .get(api)
          .then((res) => {
            const obj = res.data?.data?.find((d) => d.priority === 1);
            setIndex(obj);
          })
          .catch(() => setIndex(null));
      }
    };

    const interval = setInterval(fetchData, 60000); // fetch every 1 minute

    return () => clearInterval(interval); // cleanup on unmount
  }, [api]);

  if (!index) return null;

  return (
    <div
     className="banner"
      style={{
        width: "100%",
        margin: "0 auto 10px auto",
        background: getBgColor(index.pChange),
        color: "#00000",
        borderRadius: "10px",
        border: `2px solid ${color}`,
        padding: "10px 0",
        marginRight: "24px",
        textAlign: "center",
        fontWeight: "bold",
       // fontSize: "0.9em",
      }}
    >
      {index.symbol} &nbsp; | &nbsp; {index.lastPrice} &nbsp; | &nbsp;{" "}
      {index.pChange}% &nbsp; | &nbsp; Change: {index.change}
    </div>
  );
}

function BseLiveBanner() {
  const [bse, setBse] = useState(null);

  useEffect(() => {
    // Always fetch once on load
    axios
      .get(`${localurl}/api/bselive`)
      .then((res) => setBse(res.data))
      .catch(() => setBse(null));

    const fetchData = () => {
      // Get current time in IST
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (5.5 * 60 * 60 * 1000));
      const day = ist.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
      const hour = ist.getHours();
      const minute = ist.getMinutes();

      // Only run on Monday (1) to Friday (5), and between 8:30 and 16:00 IST
      const isMarketDay = day >= 1 && day <= 5;
      const isMarketTime =
        (hour > 8 && hour < 16) ||
        (hour === 8 && minute >= 30) ||
        (hour === 16 && minute === 0);

      if (isMarketDay && isMarketTime) {
        axios
          .get(`${localurl}/api/bselive`)
          .then((res) => setBse(res.data))
          .catch(() => setBse(null));
      }
    };

    const interval = setInterval(fetchData, 60000); // fetch every 1 minute

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  if (!bse) return null;

  return (
    <div
     className="banner"
      style={{
        width: "100%",
        margin: "0 auto 10px auto",
        background: getBgColor(bse.ChgPer),
        borderRadius: "10px",
        border: "2px solid #e65100",
        padding: "10px 0",
        textAlign: "center",
        // fontSize: "0.9em",
        fontWeight: "bold",
        boxShadow: "0 2px 6px #0001",
        marginRight: "24px",
      }}
    >
      {bse.IndexName || bse.Index_Name} &nbsp; | &nbsp; {bse.CurrValue} &nbsp; |
      &nbsp; {bse.ChgPer}% &nbsp; | &nbsp; Change: {bse.Chg}
    </div>
  );
}

// Specific banners
function Nifty50LiveBanner() {
  return (
    <NiftyIndexBanner
      api={`${localurl}/api/nifty50live`}
      color="#ff9800"
    />
  );
}
function NiftyBankLiveBanner() {
  return (
    <NiftyIndexBanner
      api={`${localurl}/api/niftybanklive`}
      color="#1976d2"
    />
  );
}
function NiftyFinanceLiveBanner() {
  return (
    <NiftyIndexBanner
      api={`${localurl}/api/niftyfinancelive`}
      color="#8e24aa"
    />
  );
}

function Heatmap() {
  return (
    <div>
      <div
        style={{
          width: "100%",
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderBottom: "2px solid #ddd",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0", color: "#333", fontSize: "24px" }}>
          📚 Learning Purpose
        </h1>
        <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
          Stock Market Heatmap and Analysis Tool
        </p>
      </div>
      <HeatmapContent />
    </div>
  );
}

function HeatmapContent() {
  const [bankData, setBankData] = useState([]);
  const [financeData, setFinanceData] = useState([]);
  const [niftyData, setNiftyData] = useState([]);
  const [volumeFirst, setVolumeFirst] = useState(false);

  // these for points contribution:
  const [bankPoints, setBankPoints] = useState([]);
  const [financePoints, setFinancePoints] = useState([]);
  const [niftyPoints, setNiftyPoints] = useState([]);

const [showContributionOnly, setShowContributionOnly] = useState(false);

const [graphData, setGraphData] = useState([]);



useEffect(() => {






  // Always fetch once on load
  axios
    .get(`${localurl}/api/heatmap/banknifty`)
    .then((res) => setBankData(res.data))
    .catch(() => setBankData([]));
  axios
    .get(`${localurl}/api/heatmap/financenifty`)
    .then((res) => setFinanceData(res.data))
    .catch(() => setFinanceData([]));
  axios
    .get(`${localurl}/api/heatmap/nifty50`)
    .then((res) => setNiftyData(res.data))
    .catch(() => setNiftyData([]));

  // Fetch points contribution data
  axios
    .get(`${localurl}/api/bankniftypoints`)
    .then((res) => setBankPoints(res.data))
    .catch(() => setBankPoints([]));
  axios
    .get(`${localurl}/api/finniftypoints`)
    .then((res) => setFinancePoints(res.data))
    .catch(() => setFinancePoints([]));
  axios
    .get(`${localurl}/api/nifty50points`)
    .then((res) => setNiftyPoints(res.data))
    .catch(() => setNiftyPoints([]));

  const fetchAll = () => {
    // ...existing IST time logic...
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (5.5 * 60 * 60 * 1000));
    const day = ist.getDay();
    const hour = ist.getHours();
    const minute = ist.getMinutes();

    const isMarketDay = day >= 1 && day <= 5;
    const isMarketTime =
      (hour > 8 && hour < 16) ||
      (hour === 8 && minute >= 30) ||
      (hour === 16 && minute === 0);

    if (isMarketDay && isMarketTime) {
      axios
        .get(`${localurl}/api/heatmap/banknifty`)
        .then((res) => setBankData(res.data))
        .catch(() => setBankData([]));
      axios
        .get(`${localurl}/api/heatmap/financenifty`)
        .then((res) => setFinanceData(res.data))
        .catch(() => setFinanceData([]));
      axios
        .get(`${localurl}/api/heatmap/nifty50`)
        .then((res) => setNiftyData(res.data))
        .catch(() => setNiftyData([]));

      // Fetch points contribution data
      axios
        .get(`${localurl}/api/bankniftypoints`)
        .then((res) => setBankPoints(res.data))
        .catch(() => setBankPoints([]));
      axios
        .get(`${localurl}/api/finniftypoints`)
        .then((res) => setFinancePoints(res.data))
        .catch(() => setFinancePoints([]));
      axios
        .get(`${localurl}/api/nifty50points`)
        .then((res) => setNiftyPoints(res.data))
        .catch(() => setNiftyPoints([]));
    }
  };

  const interval = setInterval(fetchAll, 60000); // fetch every 1 minute

  return () => clearInterval(interval); // cleanup on unmount
}, []);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/db/topstocks")
      .then((res) => {
        console.log("API response:", res.data);
        setGraphData(res.data);
      })
      .catch((err) => {
        console.error("API error:", err);
        setGraphData([]);
      });
  }, []);



console.log("graphdataa", graphData);
function mergeContribution(dataArr, pointsObj) {
  const arr = Array.isArray(dataArr) ? dataArr : (dataArr ? [dataArr] : []);
  const pointsList = pointsObj?.data?.indexContributionList || [];
  return arr.map(item => {
    const point = pointsList.find(p => p.symbol === item.symbol);
    return {
      ...item,
      contribution: point ? point.contribution : null
    };
  });
}

// Usage example:
const bankDataWithContribution = mergeContribution(bankData, bankPoints);
const financeDataWithContribution = mergeContribution(financeData, financePoints);
const niftyDataWithContribution = mergeContribution(niftyData, niftyPoints);

console.log(bankPoints,"bankPoints")

console.log("Bank Data with Contribution:", bankDataWithContribution);
console.log("Finance Data with Contribution:", financeDataWithContribution);

// Then use bankDataWithContribution, etc., in your rendering logic.

  // access data http://localhost:5001/api/db/topstocks
  

  // Helper to sort by totalTradedVolume present first
  const sortVolumeFirst = (arr) => {
    if (!volumeFirst) return arr;
    return [...arr].sort((a, b) => {
      const aVol = Number(a.totalTradedVolume) || 0;
      const bVol = Number(b.totalTradedVolume) || 0;
      return bVol - aVol; // Sort by volume descending
    });
  };

  const bse30Data = sortVolumeFirst(
    [...niftyData] // ensure new reference for React
      .filter((item) => BSE30_SYMBOLS.includes(item.symbol))
      .sort((a, b) => parseFloat(b.pChange) - parseFloat(a.pChange))
  );

  const renderBox = (item, idx) => (
    <div
      key={item.symbol || idx}
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "8px 10px",
        minWidth: "120px",
        minHeight: "48px",
        background: getBgColor(item.pChange),
        boxShadow: "0 2px 6px #0001",
        color: "black",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginBottom: "6px",
      }}
    >
      <div
        style={{ fontWeight: "bold", fontSize: "0.8em", marginBottom: "4px" }}
      >
        {item.symbol}
      </div>
      <div style={{ fontSize: "0.8em", fontWeight: "bold" }}>
        {item.lastPrice}{" "}
        <span style={{ fontSize: "0.9em" }}>({item.pChange}%)</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "2px",
        }}
      >
        <span
          style={{ fontSize: "0.7em", fontWeight: "bold", display: "block" }}
        >
          Q {item.totalTradedVolume}
        </span>
        <span
          style={{ fontSize: "0.7em", fontWeight: "bold", display: "block" }}
        >
          V {item.vwap}
        </span>
      </div>
      {/* Show contribution if available */}
    {item.contribution !== null && item.contribution !== undefined && (
      <div style={{ fontSize: "0.7em", fontWeight: "bold", color: "#222" }}>
        Contribution: {item.contribution}
      </div>
    )}
    </div>
  );

  // Place this at the top of your file or in a separate file
function CommonButton({ label, color = "#1976d2", onClick, style = {} }) {
  return (
    <button
      style={{
        margin: "12px 0 24px 0",
        padding: "8px 18px",
        background: color,
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: "pointer",
        ...style,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const filteredBankData = showContributionOnly
  ? bankDataWithContribution
      .filter(item => item.contribution !== null && item.contribution !== undefined)
      .sort((a, b) => b.contribution - a.contribution)
  : bankDataWithContribution;

const filteredFinanceData = showContributionOnly
  ? financeDataWithContribution
      .filter(item => item.contribution !== null && item.contribution !== undefined)
      .sort((a, b) => b.contribution - a.contribution)
  : financeDataWithContribution;

const filteredNiftyData = showContributionOnly
  ? niftyDataWithContribution
      .filter(item => item.contribution !== null && item.contribution !== undefined)
      .sort((a, b) => b.contribution - a.contribution)
  : niftyDataWithContribution;


  return (
    <div
      style={{ paddingLeft: "24px", paddingTop:  "5px"}}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "18px",
          marginRight: "24px",
          marginBottom: "8px",
        }}
      >
  <CommonButton
  label={volumeFirst ? "% first" : "Volume First (Q)"}
  color="#1976d2"
  onClick={() => setVolumeFirst((v) => !v)}
/>
<CommonButton
  label={showContributionOnly ? "% first " : "Filter with Contribution"}
  color="#8e24aa"
  onClick={() => setShowContributionOnly((v) => !v)}
/>
<CommonButton
  label="Graphs"
  color="#009688"
  onClick={async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/db/topstocks");
      localStorage.setItem("graphData", JSON.stringify(res.data));
      window.open('/graphs', '_blank', 'width=700,height=500');
    } catch (err) {
      console.error("API error:", err);
      localStorage.setItem("graphData", "[]");
      window.open('/graphs', '_blank', 'width=700,height=500');
    }
  }}
/>

        <div>
          <b>V</b> = <span style={{ fontWeight: 400 }}>VWAP</span>
        </div>
        <div>
          <b>Q</b>=
          <span style={{ fontWeight: 400 }}>Total Traded Volume</span>
        </div>
      </div>
      <NiftyBankLiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortVolumeFirst([...filteredBankData]).map(renderBox)}
      </div>
      <NiftyFinanceLiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortVolumeFirst([...filteredFinanceData]).map(renderBox)}
      </div>
      <BseLiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {bse30Data.map(renderBox)}
      </div>
      <Nifty50LiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortVolumeFirst([...filteredNiftyData]).map(renderBox)}
      </div>
    </div>
  );
}

export default Heatmap;