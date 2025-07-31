"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Globe, LineChart, BarChart2 } from "lucide-react";

const sidebarItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Explore", href: "/explore", icon: Globe },
  { name: "Portfolio", href: "/portfolio", icon: LineChart },
  { name: "Trade", href: "/trade", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-14 border-r bg-background lg:w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href && "bg-secondary"
                  )}
                  asChild
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5 mr-2" />
                    <span className="hidden lg:inline-block">{item.name}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
