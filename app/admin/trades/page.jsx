// app/admin/trades/page.jsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
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
import { Search, RefreshCcw, ArrowUp, ArrowDown } from "lucide-react";
import { TradeStatusCell } from "@/components/admin/trade-status-cell";

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0 && hours > 0) {
    return `${days}d ${hours}h`;
  }
  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

export default function AdminTrades() {
  const [trades, setTrades] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tradesQuery = query(
      collection(db, "trades"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(tradesQuery, async (snapshot) => {
      const tradesList = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const tradeData = docSnapshot.data();
          const userDoc = await getDoc(doc(db, "users", tradeData.userId));
          const userData = userDoc.data();
          return {
            id: docSnapshot.id,
            ...tradeData,
            userName: userData?.name || "Unknown User",
            userDisplayId: userData?.userId || "N/A", // Add the 4-digit userId
          };
        })
      );
      setTrades(tradesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTrades = trades.filter(
    (trade) =>
      trade.coinSlug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.userDisplayId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setLoading(true);
    // The onSnapshot will automatically refresh the data
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Trade Management</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Trade ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Coin Slug</TableHead>
              <TableHead>Stack Amount</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Profit %</TableHead>
              <TableHead>Choice</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.userDisplayId}</TableCell>
                <TableCell>{trade.tradeId}</TableCell>
                <TableCell>{trade.userName}</TableCell>
                <TableCell>{trade.coinSlug}</TableCell>
                <TableCell>${trade.amount}</TableCell>
                <TableCell className="text-sm">{formatDuration(trade.duration)}</TableCell>
                <TableCell>{trade.profitPercentage}%</TableCell>
                <TableCell>
                  {trade.direction === "up" ? (
                    <div className="flex items-center text-green-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      UP
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <ArrowDown className="h-4 w-4 mr-1" />
                      DOWN
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(trade.startTime).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(trade.endTime).toLocaleString()}
                </TableCell>
                <TableCell>
                  <TradeStatusCell trade={trade} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
