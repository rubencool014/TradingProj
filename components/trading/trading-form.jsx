"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const TIME_OPTIONS = [
  { value: "sixty", label: "60% 60 Sec", duration: 60, profit: 60 },
  { value: "fourty", label: "40% 120 Sec", duration: 120, profit: 40 },
  { value: "thirty", label: "30% 180 Sec", duration: 180, profit: 30 },
];

export default function TradingForm({
  pair,
  direction,
  onSubmit,
  onClose,
  variant = "default",
}) {
  const [selectedTime, setSelectedTime] = useState("sixty");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const getTimeDetails = () => {
    const option = TIME_OPTIONS.find((opt) => opt.value === selectedTime);
    return option || TIME_OPTIONS[0];
  };

  const calculateProfit = () => {
    const { profit } = getTimeDetails();
    const inputAmount = parseFloat(amount) || 0;
    const profitAmount = (inputAmount * profit) / 100;
    return {
      expectedProfit: profitAmount,
      totalAmount: inputAmount + profitAmount,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { duration, profit } = getTimeDetails();
    await onSubmit(parseFloat(amount), duration, profit);
    setLoading(false);
  };

  const { expectedProfit, totalAmount } = calculateProfit();

  return (
    <form onSubmit={handleSubmit} className="px-4">
      <Tabs
        value={selectedTime}
        onValueChange={setSelectedTime}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          {TIME_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="text-left"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Amount (USD)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>

        {amount && (
          <div className="space-y-2 p-4 bg-secondary rounded-lg">
            <div className="flex justify-between">
              <span>Expected Profit:</span>
              <span className="font-medium">${expectedProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Balance After Profit:</span>
              <span className="font-medium">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <DrawerFooter className="px-0">
        <Button
          type="submit"
          variant={variant}
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `TRADE ${direction?.toUpperCase()}`
          )}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DrawerFooter>
    </form>
  );
}
