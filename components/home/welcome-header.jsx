"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function WelcomeHeader({ userData }) {
  if (!userData) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {userData.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your portfolio and trade cryptocurrencies
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">USD Balance</p>
              <p className="text-2xl font-bold">
                ${userData.balance.usd.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
