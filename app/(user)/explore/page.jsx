"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tradingPairs } from "@/utils/trading-pairs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPair, setSelectedPair] = useState(null);
  const [cryptoData, setCryptoData] = useState([]);
  const router = useRouter();

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
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTrade = (pair) => {
    router.push(`/trade?pair=${pair.wsSymbol}`);
  };

  const filteredCryptos = cryptoData.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Explore</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or symbol..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Cryptocurrencies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Volume (24h)</TableHead>
                <TableHead className="text-right">Trade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCryptos.map((crypto) => (
                <TableRow key={crypto.wsSymbol}>
                  <TableCell>
                    <div className="flex items-center gap-2" suppressHydrationWarning>
                      <img
                        src={crypto.logo}
                        alt={crypto.name}
                        className="w-6 h-6"
                        suppressHydrationWarning
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
                  <TableCell className="text-right">
                    ${(crypto.volume / 1e9).toFixed(2)}B
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleTrade(crypto)}>
                      Trade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
