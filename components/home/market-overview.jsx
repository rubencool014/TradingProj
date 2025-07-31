"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tradingPairs } from "@/utils/trading-pairs";

export default function MarketOverview() {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = tradingPairs.map(async (pair) => {
          const response = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair.wsSymbol.toUpperCase()}`
          );
          const data = await response.json();
          return {
            ...pair,
            current_price: parseFloat(data.lastPrice),
            price_change_percentage_24h: parseFloat(data.priceChangePercent),
            market_cap: parseFloat(data.quoteVolume),
            volume: parseFloat(data.volume),
          };
        });

        const data = await Promise.all(promises);
        setCryptoData(data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cryptoData.map((crypto) => (
              <TableRow key={crypto.wsSymbol}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img
                      src={crypto.logo}
                      alt={crypto.name}
                      className="w-6 h-6"
                    />
                    <div>
                      <div className="font-medium">{crypto.name}</div>
                      <Badge variant="outline">{crypto.symbol}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${crypto.current_price.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className={cn(
                      "flex items-center justify-end",
                      crypto.price_change_percentage_24h > 0
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    {crypto.price_change_percentage_24h > 0 ? (
                      <ArrowUpRight className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4" />
                    )}
                    {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${(crypto.market_cap / 1e9).toFixed(2)}B
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
