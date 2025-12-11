"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PortfolioBalance() {
  const [balance, setBalance] = useState({
    usd: 0,
    btc: 0,
  });

  useEffect(() => {
    const fetchBalance = async () => {
      if (!auth.currentUser) return;

      try {
        const balanceDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (balanceDoc.exists()) {
          const data = balanceDoc.data();
          setBalance({
            usd: data.balance?.usd || 0,
            btc: data.balance?.btc || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        // Silently fail - component will show default values
      }
    };

    fetchBalance();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 ">
          <div className="bg-secondary p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">USD Balance</div>
            <div className="text-2xl font-bold">${balance.usd.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
