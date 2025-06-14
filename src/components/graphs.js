import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const STOCKS = ["HDFCBANK","ICICIBANK", "RELIANCE","INFY",  "BHARTIARTL"];
const Next5 = ["LT", "ITC", "TCS", "AXISBANK", "KOTAKBANK"];

const BanksTop5 = [
  "HDFCBANK",
  "ICICIBANK",
  "AXISBANK",
  "KOTAKBANK",
  "SBIN"
];

const STATIC_DATA = [/* ...your static data... */];

const Graphs = ({ data }) => {
  let response = data;
  if (!response || response.length === 0) {
    const stored = localStorage.getItem("graphData");
    if (stored) {
      try {
        response = JSON.parse(stored);
      } catch {
        response = STATIC_DATA;
      }
    } else {
      response = STATIC_DATA;
    }
  }

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const chartRef2 = useRef(null);
  const chartInstanceRef2 = useRef(null);

  const chartRef3 = useRef(null);
  const chartInstanceRef3 = useRef(null);

  // Extract date info from the first data point (if available)
  const dateInfo = response && response.length > 0 ? response[0] : null;
  const chartTitle = dateInfo
    ? `${dateInfo.Day}, ${dateInfo.Month} ${dateInfo.DayNumber}, ${dateInfo.Year}`
    : "Stock % Change (Every 2 mins)";

  useEffect(() => {
    // First chart
    const labels = response.map((row) => row.Time);
    const datasets = STOCKS.map((symbol) => ({
      label: symbol,
      data: response.map((row) => {
        const found = Array.isArray(row.Data)
          ? row.Data.find((d) => d.symbol === symbol)
          : null;
        return found && typeof found.changepct === "number"
          ? found.changepct
          : null;
      }),
      borderColor:
        symbol === "INFY"
          ? "#1976d2"
          : symbol === "RELIANCE"
          ? "#43a047"
          : symbol === "ICICIBANK"
          ? "#e65100"
          : symbol === "BHARTIARTL"
          ? "#8e24aa"
          : symbol === "HDFCBANK"
          ? "#d32f2f"
          : "#888",
      fill: false,
    }));

    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        scales: {
          y: {
            min: -5,
            max: 5,
            title: { display: true, text: "% Change" },
            ticks: { callback: (v) => v + "%" },
          },
          x: { title: { display: true, text: "Time" } },
        },
        plugins: {
          title: { display: true, text: chartTitle + " (Top 5 Free Float)" },
          legend: { position: "top" },
        },
      },
    });

    // Second chart (Next5)
    const datasets2 = Next5.map((symbol) => ({
      label: symbol,
      data: response.map((row) => {
        const found = Array.isArray(row.Data)
          ? row.Data.find((d) => d.symbol === symbol)
          : null;
        return found && typeof found.changepct === "number"
          ? found.changepct
          : null;
      }),
      borderColor:
        symbol === "LT"
          ? "#1976d2"
          : symbol === "ITC"
          ? "#43a047"
          : symbol === "TCS"
          ? "#e65100"
          : symbol === "AXISBANK"
          ? "#8e24aa"
          : symbol === "KOTAKBANK"
          ? "#d32f2f"
          : "#888",
      fill: false,
    }));

    const ctx2 = chartRef2.current.getContext("2d");
    if (chartInstanceRef2.current) {
      chartInstanceRef2.current.destroy();
    }
    chartInstanceRef2.current = new Chart(ctx2, {
      type: "line",
      data: { labels, datasets: datasets2 },
      options: {
        scales: {
          y: {
            min: -5,
            max: 5,
            title: { display: true, text: "% Change" },
            ticks: { callback: (v) => v + "%" },
          },
          x: { title: { display: true, text: "Time" } },
        },
        plugins: {
          title: { display: true, text: chartTitle + " (Top 6-10 Free Float)" },
          legend: { position: "top" },
        },
      },
    });

    // Third chart (BanksTop5)
    const datasets3 = BanksTop5.map((symbol) => ({
      label: symbol,
      data: response.map((row) => {
        const found = Array.isArray(row.Data)
          ? row.Data.find((d) => d.symbol === symbol)
          : null;
        return found && typeof found.changepct === "number"
          ? found.changepct
          : null;
      }),
      borderColor:
        symbol === "HDFCBANK"
          ? "#1976d2"
          : symbol === "ICICIBANK"
          ? "#43a047"
          : symbol === "AXISBANK"
          ? "#e65100"
          : symbol === "KOTAKBANK"
          ? "#8e24aa"
          : symbol === "SBIN"
          ? "#d32f2f"
          : "#888",
      fill: false,
    }));

    const ctx3 = chartRef3.current.getContext("2d");
    if (chartInstanceRef3.current) {
      chartInstanceRef3.current.destroy();
    }
    chartInstanceRef3.current = new Chart(ctx3, {
      type: "line",
      data: { labels, datasets: datasets3 },
      options: {
        scales: {
          y: {
            min: -5,
            max: 5,
            title: { display: true, text: "% Change" },
            ticks: { callback: (v) => v + "%" },
          },
          x: { title: { display: true, text: "Time" } },
        },
        plugins: {
          title: { display: true, text: chartTitle + " (Top 5 Banks)" },
          legend: { position: "top" },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      if (chartInstanceRef2.current) {
        chartInstanceRef2.current.destroy();
        chartInstanceRef2.current = null;
      }
      if (chartInstanceRef3.current) {
        chartInstanceRef3.current.destroy();
        chartInstanceRef3.current = null;
      }
    };
  }, [response]);

  return (
    <div>
      <canvas ref={chartRef} width={600} height={400}></canvas>
      <canvas ref={chartRef2} width={600} height={400} style={{ marginTop: 32 }}></canvas>
      <canvas ref={chartRef3} width={600} height={400} style={{ marginTop: 32 }}></canvas>
    </div>
  );
};

export default Graphs;