"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, LineChart } from "lucide-react";

const sidebarItems = [
  { name: "Trades", href: "/admin/trades", icon: LineChart },
  { name: "Users", href: "/admin/users", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background">
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
                    {item.name}
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
