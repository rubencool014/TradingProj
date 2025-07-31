"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PriceChart() {
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7&interval=daily"
        );
        const data = await response.json();
        setPriceHistory(data.prices);
      } catch (error) {
        console.error("Error fetching price history:", error);
      }
    };

    fetchPriceHistory();
  }, []);

  const chartData = {
    labels: priceHistory.map((price) =>
      new Date(price[0]).toLocaleDateString()
    ),
    datasets: [
      {
        label: "BTC Price (USD)",
        data: priceHistory.map((price) => price[1]),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price History (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {priceHistory.length > 0 ? (
          <Line data={chartData} options={{ responsive: true }} />
        ) : (
          <div className="text-center py-4">Loading price history...</div>
        )}
      </CardContent>
    </Card>
  );
}
