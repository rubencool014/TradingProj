// app/(user)/page.js

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import WelcomeHeader from "@/components/home/welcome-header";
import ActionButtons from "@/components/home/action-buttons";
import MarketOverview from "@/components/home/market-overview";

export default function Home() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const unsubscribeSnapshot = onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            setUserData({
              ...doc.data(),
              balance: {
                usd: parseFloat(doc.data().balance?.usd || 0).toFixed(2),
              },
            });
          }
        });

        return () => unsubscribeSnapshot();
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8" suppressHydrationWarning>
      <WelcomeHeader userData={userData} />
      <ActionButtons userData={userData} />
      <MarketOverview />
    </div>
  );
}
