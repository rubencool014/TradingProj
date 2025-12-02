// components/admin/trade-status-cell.jsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const isUpdatingRef = useRef(false);

  const updateStatus = useCallback(async (newStatus) => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    setLoading(true);
    try {
      const tradeRef = doc(db, "trades", trade.id);
      const tradeDoc = await getDoc(tradeRef);
      const tradeData = tradeDoc.data();

      // Only allow status update if trade is active
      if (tradeData.status !== "active") {
        return;
      }

      // Admin can change status at any time
      // Users will only see the result after trade time ends
      // Balance will only be updated after trade time ends
      
      // Check if trade time has ended
      const tradeEndTime = new Date(tradeData.endTime).getTime();
      const currentTime = new Date().getTime();
      const hasEnded = currentTime >= tradeEndTime;

      // Calculate balance update
      let balanceUpdate = 0;
      if (newStatus === "profit") {
        // Profit = original amount + profit percentage
        balanceUpdate = (tradeData.amount * tradeData.profitPercentage) / 100;
      } else if (newStatus === "loss") {
        // Loss = amount was already deducted, no need to add anything back
        balanceUpdate = 0;
      } else if (newStatus === "expired") {
        // Expired = return original amount
        balanceUpdate = tradeData.amount;
      }

      // Update user balance ONLY if trade time has ended
      // Note: The amount was already deducted when the trade was created
      if (hasEnded) {
        const userRef = doc(db, "users", trade.userId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (newStatus === "profit") {
          // For profit: return the amount + add the profit
          const profitAmount = (tradeData.amount * tradeData.profitPercentage) / 100;
          const newBalance = parseFloat(userData.balance.usd) + parseFloat(tradeData.amount) + profitAmount;
          await updateDoc(userRef, {
            "balance.usd": newBalance,
          });
        } else if (newStatus === "loss") {
          // For loss: amount was already deducted when trade was created, nothing to do
          // Balance remains as is (already reduced)
        } else if (newStatus === "expired") {
          // For expired: return the original amount
          const newBalance = parseFloat(userData.balance.usd) + parseFloat(tradeData.amount);
          await updateDoc(userRef, {
            "balance.usd": newBalance,
          });
        }
      }

      // Update trade status (this happens regardless of whether time has ended)
      await updateDoc(tradeRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        balanceUpdate,
        balanceUpdated: hasEnded, // Flag to track if balance was updated
        adminUpdated: true, // Add this flag to indicate admin update
      });
    } catch (error) {
      console.error("Error updating trade status:", error);
    } finally {
      setLoading(false);
      isUpdatingRef.current = false;
    }
  }, [trade.id, trade.userId]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(trade.endTime).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((end - now) / 1000));
    };

    let balanceCheckDone = false;

    const checkAndUpdateBalance = async () => {
      // If trade time has ended and status is not active, check if balance needs updating
      const endTime = new Date(trade.endTime).getTime();
      const now = new Date().getTime();
      const hasEnded = now >= endTime;
      
      if (hasEnded && trade.status !== "active" && !trade.balanceUpdated && !balanceCheckDone) {
        balanceCheckDone = true; // Prevent multiple checks
        // Trade ended, status was set by admin, but balance not updated yet
        // Update balance now
        try {
          const tradeRef = doc(db, "trades", trade.id);
          const tradeDoc = await getDoc(tradeRef);
          const tradeData = tradeDoc.data();
          
          // Double-check status hasn't changed
          if (tradeData.status === "active" || tradeData.balanceUpdated) {
            return;
          }

          const userRef = doc(db, "users", trade.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          if (tradeData.status === "profit") {
            const profitAmount = (tradeData.amount * tradeData.profitPercentage) / 100;
            const newBalance = parseFloat(userData.balance.usd) + parseFloat(tradeData.amount) + profitAmount;
            await updateDoc(userRef, {
              "balance.usd": newBalance,
            });
          } else if (tradeData.status === "expired") {
            const newBalance = parseFloat(userData.balance.usd) + parseFloat(tradeData.amount);
            await updateDoc(userRef, {
              "balance.usd": newBalance,
            });
          }
          // For loss, balance was already deducted, no update needed

          // Mark balance as updated
          await updateDoc(tradeRef, {
            balanceUpdated: true,
          });
        } catch (error) {
          console.error("Error updating balance when time ended:", error);
          balanceCheckDone = false; // Reset on error so it can retry
        }
      }
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Auto-expire trade if time is up and status is still active
      if (remaining === 0 && trade.status === "active") {
        updateStatus("expired");
      }

      // Check if balance needs updating when time ends (only once)
      if (remaining === 0 && !balanceCheckDone) {
        checkAndUpdateBalance();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trade, updateStatus]);

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
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0" 
              disabled={loading}
              title="Set trade result (users will see after time ends)"
            >
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
