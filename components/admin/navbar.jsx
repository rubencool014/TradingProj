"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const adminDoc = doc(db, "admins", user.uid);
        const unsubscribeDoc = onSnapshot(adminDoc, (doc) => {
          if (doc.exists()) {
            setAdminData(doc.data());
          }
        });
        return () => unsubscribeDoc();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2 font-semibold pr-4">
          <Image src="/main/logo.svg" alt="Logo" width={32} height={32} />
        </div>
        <div className="flex items-center gap-2 font-semibold fill-slate-400">
          Admin Dashboard
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {adminData && (
            <>
              <span className="text-sm text-muted-foreground">
                {adminData.email}
              </span>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/manage">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Manage Admins</span>
                </Link>
              </Button>
            </>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
