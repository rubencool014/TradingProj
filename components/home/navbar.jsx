"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserCircle, Wallet } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const unsubscribeDoc = onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setBalance({
              usd: parseFloat(userData.balance?.usd || 0).toFixed(2),
              // Add other currencies if needed
            });
          }
        });
        return () => unsubscribeDoc();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      <div className="flex h-14 items-center px-4" suppressHydrationWarning>
        <div className="flex items-center gap-2 font-semibold" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <Image src="/main/logo.svg" alt="Logo" width={32} height={32} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {user && balance && (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4" />
              <span>${balance.usd?.toLocaleString() ?? "0.00"}</span>
            </div>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
