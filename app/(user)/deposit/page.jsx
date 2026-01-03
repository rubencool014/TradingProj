"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const walletAddresses = [
  {
    id: "eth",
    name: "Ethereum (ETH)",
    address: "0xf835acb64265158728db4d3bbbc04d08ce3139b3",
    network: "ERC-20",
    icon: "Ξ",
  },
  {
    id: "btc",
    name: "Bitcoin (BTC)",
    address: "bc1qlxyntnwrwm3zfgkmzh3e499qr276yth6ew9n7r",
    network: "Bitcoin",
    icon: "₿",
  },
  {
    id: "usdc",
    name: "USD Coin (USDC)",
    address: "0xf835acb64265158728db4d3bbbc04d08ce3139b3",
    network: "ERC-20",
    icon: "$",
  },
  {
    id: "sol",
    name: "Solana (SOL)",
    address: "ZjFD7TkEnPoqmKpLr5BhFVndvd9rjD2jET8pbtSwD7C",
    network: "Solana",
    icon: "◎",
  },
  {
    id: "usdt",
    name: "Tether (USDT)",
    address: "TRCF96qiJhwYD9EvJvrn9YMfZwJ7q5GCnv",
    network: "TRC-20",
    icon: "₮",
  },
  {
    id: "polygon",
    name: "Polygon (POL)",
    address: "0xf835aCB64265158728dB4d3bbbc04d08Ce3139b3",
    network: "Polygon",
    icon: "⬟",
  },
  {
    id: "base",
    name: "Base (ETH)",
    address: "0xf835aCB64265158728dB4d3bbbc04d08Ce3139b3",
    network: "Base",
    icon: "🔵",
  },
  {
    id: "bnb",
    name: "BNB Smart Chain (BNB)",
    address: "0xf835aCB64265158728dB4d3bbbc04d08Ce3139b3",
    network: "BNB Smart Chain",
    icon: "◉",
  },
];

export default function DepositPage() {
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCopy = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
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
          <Wallet className="h-6 w-6 sm:h-8 sm:w-8" />
          Deposit Funds
        </h1>
        <p className="text-muted-foreground mt-2">
          Select a wallet to deposit your amount
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please ensure you send funds to the correct network. Sending to the
          wrong network may result in permanent loss of funds.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {walletAddresses.map((wallet) => (
          <Card
            key={wallet.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedWallet?.id === wallet.id
                ? "ring-2 ring-primary border-primary"
                : ""
            }`}
            onClick={() => setSelectedWallet(wallet)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                    {wallet.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{wallet.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {wallet.network}
                    </CardDescription>
                  </div>
                </div>
                {selectedWallet?.id === wallet.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedWallet && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Selected Wallet: {selectedWallet.name}
            </CardTitle>
            <CardDescription>
              Copy the address below and use it in your wallet app to send funds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Network
              </label>
              <p className="text-base font-medium">{selectedWallet.network}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border">
                <code className="flex-1 text-sm break-all font-mono">
                  {selectedWallet.address}
                </code>
                <Button
                  size="icon"
                  onClick={() => handleCopy(selectedWallet.address)}
                  variant={copied ? "default" : "outline"}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Only send {selectedWallet.name}{" "}
                tokens to this address on the {selectedWallet.network} network.
                Sending other cryptocurrencies or using a different network may
                result in permanent loss of funds.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {!selectedWallet && (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Select a wallet above to view the deposit address
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

