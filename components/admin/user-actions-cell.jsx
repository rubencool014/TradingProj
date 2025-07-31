// components/admin/user-actions-cell.jsx

"use client";

import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";

export function UserActionsCell({ user }) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState("");
  const [amount, setAmount] = useState("");

  const handleAction = async (e) => {
    e.preventDefault();
    if (!amount || loading) return;

    setLoading(true);
    const numAmount = parseFloat(amount);
    const userRef = doc(db, "users", user.id);

    try {
      switch (actionType) {
        case "addBalance":
          await updateDoc(userRef, {
            "balance.usd": parseFloat(user.balance.usd) + numAmount,
            balanceChanges: arrayUnion(numAmount),
          });
          break;
        case "subtractBalance":
          await updateDoc(userRef, {
            "balance.usd": Math.max(
              0,
              parseFloat(user.balance.usd) - numAmount
            ),
            balanceChanges: arrayUnion(-numAmount),
          });
          break;
        case "addCredit":
          await updateDoc(userRef, {
            creditScore: user.creditScore + numAmount,
            creditScoreChanges: arrayUnion(numAmount),
          });
          break;
        case "subtractCredit":
          await updateDoc(userRef, {
            creditScore: Math.max(0, user.creditScore - numAmount),
            creditScoreChanges: arrayUnion(-numAmount),
          });
          break;
      }
      setShowDialog(false);
      setAmount("");
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setActionType("addBalance");
              setShowDialog(true);
            }}
          >
            Add Balance
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setActionType("subtractBalance");
              setShowDialog(true);
            }}
          >
            Subtract Balance
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setActionType("addCredit");
              setShowDialog(true);
            }}
          >
            Add Credit Score
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setActionType("subtractCredit");
              setShowDialog(true);
            }}
          >
            Subtract Credit Score
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "addBalance"
                ? "Add Balance"
                : actionType === "subtractBalance"
                ? "Subtract Balance"
                : actionType === "addCredit"
                ? "Add Credit Score"
                : "Subtract Credit Score"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAction}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step={actionType.includes("Credit") ? "1" : "0.01"}
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    actionType.includes("Balance")
                      ? "Enter USD amount"
                      : "Enter points"
                  }
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={loading}>
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
