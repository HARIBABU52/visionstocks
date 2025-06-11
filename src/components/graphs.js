import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const Graphs = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    const data = {
      labels: ["9:00", "9:05", "9:10"], // 5-min intervals
      datasets: [
        {
          label: "HDFC",
          data: [0.3, 0.5, -1.0],
          borderColor: "blue",
          fill: false,
        },
        {
          label: "ICICI",
          data: [0.7, 1.5, 2.0],
          borderColor: "green",
          fill: false,
        },
        {
          label: "Axis",
          data: [0.1, -0.5, -2.0],
          borderColor: "red",
          fill: false,
        },
      ],
    };

    const config = {
      type: "line",
      data: data,
      options: {
        scales: {
          y: {
            min: -3,
            max: 3,
            ticks: {
              callback: (value) => value + "%",
            },
            title: {
              display: true,
              text: "Percentage Change",
            },
          },
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "Stock % Change (Every 5 mins)",
          },
          legend: {
            position: "top",
          },
        },
      },
    };

    const chartInstance = new Chart(ctx, config);

    return () => {
      chartInstance.destroy();
    };
  }, []);

  return (
    <div>
      <canvas ref={chartRef} width={600} height={400}></canvas>
    </div>
  );
};

export default Graphs;
