"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";

const statusColors = {
  active: "bg-blue-500",
  profit: "bg-green-500",
  loss: "bg-red-500",
  expired: "bg-orange-500",
};

export default function OrderHistory() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Remove the status filter to get all trades
    const tradesQuery = query(
      collection(db, "trades"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(tradesQuery, (snapshot) => {
      const tradesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrades(tradesList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {trades.map((trade) => (
              <Card key={trade.id}>
                <CardContent className="p-4 bg-secondary">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Coin</div>
                      <div className="font-medium">
                        {trade.coinSlug.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Direction
                      </div>
                      <div className="flex items-center font-medium">
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
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Amount
                      </div>
                      <div className="font-medium">${trade.amount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Trade Time
                      </div>
                      <div className="font-medium">{trade.duration}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Start Time
                      </div>
                      <div className="font-medium">
                        {new Date(trade.startTime).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        End Time
                      </div>
                      <div className="font-medium">
                        {new Date(trade.endTime).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Profit/Loss
                      </div>
                      <div
                        className={`font-medium ${
                          trade.status === "profit"
                            ? "text-green-500"
                            : trade.status === "loss"
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {(() => {
                          const endTime = new Date(trade.endTime).getTime();
                          const now = new Date().getTime();
                          const hasEnded = now >= endTime;
                          
                          // Only show profit/loss if trade has ended and status is not active
                          if (hasEnded && trade.status === "profit") {
                            return `+$${(
                              (trade.amount * trade.profitPercentage) /
                              100
                            ).toFixed(2)}`;
                          } else if (hasEnded && trade.status === "loss") {
                            return `-$${trade.amount}`;
                          } else if (hasEnded && trade.status === "expired") {
                            return "$0.00";
                          } else {
                            return "Pending";
                          }
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Status
                      </div>
                      <Badge className={(() => {
                        const endTime = new Date(trade.endTime).getTime();
                        const now = new Date().getTime();
                        const hasEnded = now >= endTime;
                        
                        // Show "active" until time ends, then show actual status
                        if (!hasEnded || trade.status === "active") {
                          return statusColors.active;
                        }
                        return statusColors[trade.status] || statusColors.active;
                      })()}>
                        {(() => {
                          const endTime = new Date(trade.endTime).getTime();
                          const now = new Date().getTime();
                          const hasEnded = now >= endTime;
                          
                          // Show "ACTIVE" until time ends, then show actual status
                          if (!hasEnded || trade.status === "active") {
                            return "ACTIVE";
                          }
                          return trade.status.toUpperCase();
                        })()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
