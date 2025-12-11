


























































































































































































































"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Settings, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
import { Users, LineChart, MessageSquare, Wallet } from "lucide-react";

const sidebarItems = [
  { name: "Trades", href: "/admin/trades", icon: LineChart },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
];

export default function Navbar() {
  const [adminData, setAdminData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
      // Cookies will be cleared by the token refresh listener
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      <div className="flex h-16 items-center px-4" suppressHydrationWarning>
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
                <DrawerTitle>Admin Menu</DrawerTitle>
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

        <div className="flex items-center gap-2 font-semibold pr-4" suppressHydrationWarning>
          <div suppressHydrationWarning>
            <Image src="/main/logo.svg" alt="Logo" width={32} height={32} />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-semibold fill-slate-400">
          Admin Dashboard
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          {adminData && (
            <>
              <span className="hidden md:inline-block text-sm text-muted-foreground">
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

