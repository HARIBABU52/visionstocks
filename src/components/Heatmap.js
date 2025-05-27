import { useEffect, useState } from "react";
import axios from "axios";
import "./Heatmap.css";

function getBgColor(pChange) {
  const p = parseFloat(pChange);
  if (p >= 2) return "#06a04a"; // dark green
  if (p >= 1) return "#22bb55"; // medium green
  if (p > 0) return "#90ee90"; // light green
  if (p > -1) return "#ffb3b3"; // light red
  if (p > -2) return "#ff6666"; // medium red
  return "#b22222"; // dark red
}

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
  const fetchData = () => {
    axios
      .get(api)
      .then((res) => {
        const obj = res.data?.data?.find((d) => d.priority === 1);
        setIndex(obj);
      })
      .catch(() => setIndex(null));
  };

  fetchData(); // initial fetch
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
    const fetchData = () => {
      axios
        .get("http://localhost:5000/api/nse-heatmap/bselive")
        .then((res) => setBse(res.data))
        .catch(() => setBse(null));
    };

    fetchData(); // initial fetch
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
      api="http://localhost:5000/api/nse-heatmap/nifty50live"
      color="#ff9800"
    />
  );
}
function NiftyBankLiveBanner() {
  return (
    <NiftyIndexBanner
      api="http://localhost:5000/api/nse-heatmap/niftybanklive"
      color="#1976d2"
    />
  );
}
function NiftyFinanceLiveBanner() {
  return (
    <NiftyIndexBanner
      api="http://localhost:5000/api/nse-heatmap/niftyfinancelive"
      color="#8e24aa"
    />
  );
}

function Heatmap() {
  const [bankData, setBankData] = useState([]);
  const [financeData, setFinanceData] = useState([]);
  const [niftyData, setNiftyData] = useState([]);
  const [volumeFirst, setVolumeFirst] = useState(false);

useEffect(() => {
  const fetchAll = () => {
    axios
      .get("http://localhost:5000/api/nse-heatmap/banknifty")
      .then((res) => setBankData(res.data))
      .catch(() => setBankData([]));
    axios
      .get("http://localhost:5000/api/nse-heatmap/financenifty")
      .then((res) => setFinanceData(res.data))
      .catch(() => setFinanceData([]));
    axios
      .get("http://localhost:5000/api/nse-heatmap/nifty50")
      .then((res) => setNiftyData(res.data))
      .catch(() => setNiftyData([]));
  };

  fetchAll(); // initial fetch
  const interval = setInterval(fetchAll, 60000); // fetch every 1 minute

  return () => clearInterval(interval); // cleanup on unmount
}, []);

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
    </div>
  );

  return (
    <div
      style={{ paddingLeft: "24px", paddingTop: "5px"}}
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
        <button
          style={{
            margin: "12px 0 24px 0",
            padding: "8px 18px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          onClick={() => setVolumeFirst((v) => !v)}
        >
          {volumeFirst ? "Normal" : "Volume First (Q)"}
        </button>
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
        {sortVolumeFirst([...bankData]).map(renderBox)}
      </div>
      <NiftyFinanceLiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortVolumeFirst([...financeData]).map(renderBox)}
      </div>
      <BseLiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {bse30Data.map(renderBox)}
      </div>
      <Nifty50LiveBanner />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {sortVolumeFirst([...niftyData]).map(renderBox)}
      </div>
    </div>
  );
}

export default Heatmap ;
