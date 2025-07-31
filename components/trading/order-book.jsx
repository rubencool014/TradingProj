"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderBook() {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [lastPrice, setLastPrice] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms"
    );
    const priceWs = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@trade"
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderBook({
        bids: data.bids.slice(0, 5),
        asks: data.asks.slice(0, 5).reverse(),
      });
    };

    priceWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastPrice(parseFloat(data.p).toFixed(2));
    };

    return () => {
      ws.close();
      priceWs.close();
    };
  }, []);

  const formatNumber = (num) => {
    return parseFloat(num).toFixed(2);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Order Book</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Sells/Asks */}
          <div className="space-y-1">
            {orderBook.asks.map((ask, i) => (
              <div
                key={`ask-${i}`}
                className="flex justify-between text-red-500 text-sm"
              >
                <span>{formatNumber(ask[0])}</span>
                <span>{formatNumber(ask[1])}</span>
                <span>{formatNumber(ask[0] * ask[1])}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="text-center py-2 bg-gray-100 rounded-md">
            <span className="text-lg font-bold">
              {lastPrice || "Loading..."}
            </span>
          </div>

          {/* Buys/Bids */}
          <div className="space-y-1">
            {orderBook.bids.map((bid, i) => (
              <div
                key={`bid-${i}`}
                className="flex justify-between text-green-500 text-sm"
              >
                <span>{formatNumber(bid[0])}</span>
                <span>{formatNumber(bid[1])}</span>
                <span>{formatNumber(bid[0] * bid[1])}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
