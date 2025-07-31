// components/admin/trade-status-cell.jsx

"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  active: "bg-blue-500",
  profit: "bg-green-500",
  loss: "bg-red-500",
  expired: "bg-orange-500",
};

export function TradeStatusCell({ trade }) {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(trade.endTime).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Auto-expire trade if time is up and status is still active
      if (remaining === 0 && trade.status === "active") {
        updateStatus("expired");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trade]);

  const updateStatus = async (newStatus) => {
    if (loading) return;

    setLoading(true);
    try {
      const tradeRef = doc(db, "trades", trade.id);
      const tradeDoc = await getDoc(tradeRef);
      const tradeData = tradeDoc.data();

      // Only allow status update if trade is active
      if (tradeData.status !== "active") {
        return;
      }

      // Calculate balance update
      let balanceUpdate = 0;
      if (newStatus === "profit") {
        balanceUpdate = (tradeData.amount * tradeData.profitPercentage) / 100;
      } else if (newStatus === "loss") {
        balanceUpdate = -tradeData.amount;
      }

      // Update trade status
      await updateDoc(tradeRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        balanceUpdate,
        adminUpdated: true, // Add this flag to indicate admin update
      });

      // Update user balance if trade has ended
      if (new Date() >= new Date(trade.endTime)) {
        const userRef = doc(db, "users", trade.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (newStatus === "profit") {
          const newBalance =
            userData.balance.usd + tradeData.amount + balanceUpdate;
          await updateDoc(userRef, {
            "balance.usd": newBalance,
          });
        } else if (newStatus === "loss") {
          // No need to update balance for loss as it was already deducted
        } else if (newStatus === "expired") {
          // Return the original amount for expired trades
          const newBalance = userData.balance.usd + tradeData.amount;
          await updateDoc(userRef, {
            "balance.usd": newBalance,
          });
        }
      }
    } catch (error) {
      console.error("Error updating trade status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${statusColors[trade.status]} text-white`}>
        {trade.status.charAt(0).toUpperCase() + trade.status.slice(1)}
      </Badge>

      {timeLeft > 0 && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Timer className="h-4 w-4 mr-1" />
          {timeLeft}s
        </div>
      )}

      {trade.status === "active" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => updateStatus("profit")}>
              Set as Profit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("loss")}>
              Set as Loss
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("expired")}>
              Set as Expired
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
