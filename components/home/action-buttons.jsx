// components/home/action-buttons.jsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  CreditCard,
} from "lucide-react";

export default function ActionButtons({ userData }) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!userData) return null;

  const handleAction = (actionId) => {
    router.push("/to-be-implemented");
  };

  const actions = [
    { id: "deposit", label: "Deposit", icon: Wallet, color: "bg-blue-500" },
    {
      id: "withdraw",
      label: "Withdraw",
      icon: CreditCard,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4" suppressHydrationWarning>
      {actions.map((action) => (
        <Button
          key={action.id}
          onClick={() => handleAction(action.id)}
          className="h-24 flex flex-col items-center justify-center gap-2"
          variant="outline"
          suppressHydrationWarning
        >
          <action.icon className="h-6 w-6" />
          {action.label}
        </Button>
      ))}

      <Dialog
        open={!!selectedAction}
        onOpenChange={() => setSelectedAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedAction}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={() => handleAction(selectedAction)}
              className="w-full"
            >
              Confirm {selectedAction}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
