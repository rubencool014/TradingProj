// app/account/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  LogOut,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Account() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserData({
              ...doc.data(),
              balance: {
                usd: parseFloat(doc.data().balance?.usd || 0).toFixed(2),
              },
            });
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTransaction = async () => {
    // Implement your transaction logic here
    // For now, we'll just redirect to the to-be-implemented page
    router.push("/to-be-implemented");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  const actions = [
    { id: "buy", label: "Buy BTC", icon: ArrowDownLeft, color: "bg-green-500" },
    { id: "sell", label: "Sell BTC", icon: ArrowUpRight, color: "bg-red-500" },
    { id: "deposit", label: "Deposit USD", icon: Wallet, color: "bg-blue-500" },
    {
      id: "withdraw",
      label: "Withdraw USD",
      icon: CreditCard,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Account Details
          </CardTitle>
          <CardDescription>
            Manage your account settings and view your balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Profile Information</h3>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {userData?.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {userData?.email}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Balance
              </h3>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="bg-secondary p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">USD Balance</p>
                  <p className="text-2xl font-bold">
                    ${userData?.balance?.usd || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  onClick={() => router.push("/to-be-implemented")}
                  className="h-16"
                  variant="outline"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleTransaction}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? "Processing..." : `Confirm ${selectedAction}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
