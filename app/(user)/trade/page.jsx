"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getPairBySymbol, tradingPairs } from "@/utils/trading-pairs";
import PairSelector from "@/components/trading/pair-selector";
import TradingChart from "@/components/trading/trading-chart";
import ActiveOrders from "@/components/trading/active-orders";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import TradingForm from "@/components/trading/trading-form";
import { useToast } from "@/hooks/use-toast";
import { ensureValidToken, updateSessionCookie } from "@/utils/auth";

export default function Trade() {
  const searchParams = useSearchParams();
  const [selectedPair, setSelectedPair] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [tradeDirection, setTradeDirection] = useState(null);
  const [userData, setUserData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const symbol = searchParams.get("pair");
    const defaultPair = getPairBySymbol(symbol) || tradingPairs[0];
    setSelectedPair(defaultPair);

    // Check auth state and set cookie if needed
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Redirect to sign-in if not authenticated
        window.location.href = "/sign-in";
        return;
      }
      
      // Ensure cookie is set
      await updateSessionCookie();
      
      // Fetch user data
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    });

    return () => unsubscribe();
  }, [searchParams]);

  const handleTrade = async (amount, duration, profitPercentage) => {
    if (!auth.currentUser || !selectedPair || !userData) {
      toast({
        title: "Error",
        description: "Please sign in to trade",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough balance
    if (userData.balance.usd < amount) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to place this trade",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ensure we have a valid token before making Firestore operations
      const hasValidToken = await ensureValidToken();
      if (!hasValidToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        return;
      }

      const tradeId = `T${Date.now()}`;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 1000);

      // Create the trade document
      const tradeRef = await addDoc(collection(db, "trades"), {
        tradeId,
        userId: auth.currentUser.uid,
        userName: userData.name,
        coinSlug: selectedPair.wsSymbol,
        amount: parseFloat(amount),
        duration,
        profitPercentage,
        direction: tradeDirection,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "active",
        createdAt: serverTimestamp(),
        adminUpdated: false,
      });

      // Deduct the amount from user's balance immediately
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        "balance.usd": userData.balance.usd - parseFloat(amount),
      });

      toast({
        title: "Trade Started",
        description: `${tradeDirection.toUpperCase()} trade for ${
          selectedPair.symbol
        } initiated`,
      });

      setShowDrawer(false);
    } catch (error) {
      console.error("Error creating trade:", error);
      
      // Handle authentication errors specifically
      if (error.code === "permission-denied" || error.code === "unauthenticated") {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please refresh the page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to start trade. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1">
          <PairSelector value={selectedPair} onPairChange={setSelectedPair} />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setTradeDirection("up");
              setShowDrawer(true);
            }}
            variant="outline"
            className="gap-2 text-green-500 hover:text-green-600 flex-1 sm:flex-initial"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="hidden sm:inline">TRADE UP</span>
            <span className="sm:hidden">UP</span>
          </Button>
          <Button
            onClick={() => {
              setTradeDirection("down");
              setShowDrawer(true);
            }}
            variant="outline"
            className="gap-2 text-red-500 hover:text-red-600 flex-1 sm:flex-initial"
          >
            <ArrowDown className="h-4 w-4" />
            <span className="hidden sm:inline">TRADE DOWN</span>
            <span className="sm:hidden">DOWN</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[400px] sm:h-[500px] lg:h-[600px]">
          {selectedPair && <TradingChart pair={selectedPair} />}
        </div>
        <div className="lg:col-span-1 h-[400px] sm:h-[500px] lg:h-[600px]">
          <ActiveOrders />
        </div>
      </div>

      <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-[500px] px-4 m-6">
            <DrawerHeader>
              <DrawerTitle>
                TRADE {selectedPair?.symbol} {tradeDirection?.toUpperCase()}
              </DrawerTitle>
            </DrawerHeader>
            <TradingForm
              pair={selectedPair}
              direction={tradeDirection}
              onSubmit={handleTrade}
              onClose={() => setShowDrawer(false)}
              variant={tradeDirection === "up" ? "green" : "destructive"}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
