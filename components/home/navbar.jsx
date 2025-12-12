"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserCircle, Wallet, Menu, X, FileText, MessageCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Globe, LineChart, BarChart2 } from "lucide-react";
import FeedbackDialog from "@/components/feedback/feedback-dialog";
import UserChat from "@/components/chat/user-chat";

const sidebarItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Globe },
  { name: "Portfolio", href: "/portfolio", icon: LineChart },
  { name: "Trade", href: "/trade", icon: BarChart2 },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const pathname = usePathname();

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
        {/* Menu Button - Always visible */}
        <div className="mr-2">
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent side="left">
              <DrawerHeader className="border-b">
                <DrawerTitle>Menu</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 py-4 px-2 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DrawerClose key={item.href} asChild>
                      <Link href={item.href}>
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            pathname === item.href && "bg-secondary"
                          )}
                        >
                          <Icon className="h-5 w-5 mr-2" />
                          {item.name}
                        </Button>
                      </Link>
                    </DrawerClose>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <Link href="/" className="flex items-center gap-2 font-semibold" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <Image src="/main/logo.svg" alt="Logo" width={32} height={32} />
          </div>
          <span className="hidden sm:inline-block text-base sm:text-lg">Secure Trade Pro</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {user && balance && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4" />
              <span>${balance.usd?.toLocaleString() ?? "0.00"}</span>
            </div>
          )}
          {user && (
            <>
              <UserChat />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFeedbackDialogOpen(true)}
                title="Submit Feedback"
              >
                <FileText className="h-5 w-5" />
                <span className="sr-only">Feedback</span>
              </Button>
            </>
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
      <FeedbackDialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen} />
    </nav>
  );
}
