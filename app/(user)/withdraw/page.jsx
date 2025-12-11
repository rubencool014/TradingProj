"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { CreditCard, ArrowLeft, CheckCircle2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const coins = [
  { id: "eth", name: "Ethereum (ETH)", network: "Ethereum" },
  { id: "btc", name: "Bitcoin (BTC)", network: "Bitcoin" },
  { id: "usdc", name: "USD Coin (USDC)", network: "Ethereum" },
  { id: "sol", name: "Solana (SOL)", network: "Solana" },
  { id: "usdt", name: "Tether (USDT)", network: "Tron (TRC-20)" },
  { id: "polygon", name: "Polygon (MATIC)", network: "Polygon" },
  { id: "bnb", name: "Binance Coin (BNB)", network: "BNB Smart Chain" },
];

export default function WithdrawPage() {
  const [selectedCoin, setSelectedCoin] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            ...data,
            balance: {
              usd: parseFloat(data.balance?.usd || 0),
            },
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCoin) {
      toast({
        title: "Error",
        description: "Please select a coin",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter your wallet address",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!userData) {
      toast({
        title: "Error",
        description: "User data not loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > userData.balance.usd) {
      toast({
        title: "Insufficient Balance",
        description: `You cannot withdraw more than your available balance of $${userData.balance.usd.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const selectedCoinData = coins.find((c) => c.id === selectedCoin);

      // Get fresh user data to ensure we have the latest balance
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        toast({
          title: "Error",
          description: "User data not found. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const currentUserData = userDoc.data();
      const currentBalance = parseFloat(currentUserData.balance?.usd || 0);

      // Double-check balance before deducting
      if (amountNum > currentBalance) {
        toast({
          title: "Insufficient Balance",
          description: `Your current balance is $${currentBalance.toFixed(2)}. Please refresh and try again.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate new balance
      const newBalance = currentBalance - amountNum;

      // Create withdrawal request
      const withdrawalRef = await addDoc(collection(db, "withdrawals"), {
        userId: user.uid,
        userName: userData.name,
        userEmail: userData.email,
        coin: selectedCoinData.name,
        coinId: selectedCoin,
        network: selectedCoinData.network,
        walletAddress: walletAddress.trim(),
        amount: amountNum,
        status: "pending",
        createdAt: serverTimestamp(),
        createdAtISO: new Date().toISOString(),
      });

      // Deduct the amount from user's balance immediately
      await updateDoc(userRef, {
        "balance.usd": newBalance,
        balanceChanges: arrayUnion(-amountNum),
      });

      // Update local state to reflect the new balance
      setUserData({
        ...userData,
        balance: {
          usd: newBalance,
        },
      });

      setWithdrawalId(withdrawalRef.id);
      setSubmitted(true);

      toast({
        title: "Withdrawal Request Submitted",
        description: `$${amountNum.toFixed(2)} has been deducted from your balance. Your withdrawal request has been submitted successfully.`,
      });
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <CardTitle>Withdrawal Request Submitted</CardTitle>
            </div>
            <CardDescription>
              Your withdrawal request has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Your withdrawal request has been
                submitted successfully. The amount will be sent to your selected
                wallet address shortly. You will be notified once the transaction
                is processed.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coin:</span>
                <span className="font-semibold">
                  {coins.find((c) => c.id === selectedCoin)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Address:</span>
                <span className="font-mono text-sm break-all text-right max-w-[60%]">
                  {walletAddress}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setSelectedCoin("");
                  setWalletAddress("");
                  setAmount("");
                  setWithdrawalId(null);
                }}
                variant="outline"
                className="flex-1"
              >
                New Withdrawal
              </Button>
              <Button
                onClick={() => router.push("/account")}
                className="flex-1"
              >
                Back to Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
          Withdraw Funds
        </h1>
        <p className="text-muted-foreground mt-2">
          Request a withdrawal to your wallet address
        </p>
      </div>

      {userData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${userData.balance.usd.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You can withdraw up to this amount
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>
            Fill in the details below to request a withdrawal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coin">Select Coin</Label>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger id="coin">
                  <SelectValue placeholder="Select a coin" />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((coin) => (
                    <SelectItem key={coin.id} value={coin.id}>
                      {coin.name} ({coin.network})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Your Wallet Address</Label>
              <Input
                id="wallet"
                type="text"
                placeholder="Enter your wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Make sure to enter the correct wallet address for the selected
                network
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {userData && amount && (
                <p
                  className={`text-xs ${
                    parseFloat(amount) > userData.balance.usd
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  Available: ${userData.balance.usd.toFixed(2)}
                  {parseFloat(amount) > userData.balance.usd && (
                    <span className="ml-2">
                      (Amount exceeds available balance)
                    </span>
                  )}
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Double-check your wallet address
                before submitting. Withdrawals are processed manually and may
                take some time. Incorrect addresses may result in permanent loss
                of funds.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={loading || !userData}
              className="w-full"
            >
              {loading ? "Submitting..." : "Submit Withdrawal Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

