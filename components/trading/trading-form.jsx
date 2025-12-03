"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DrawerFooter } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Helper function to format duration for display
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  if (seconds < 86400) return `${seconds / 3600}h`;
  const days = seconds / 86400;
  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

const TIME_OPTIONS = [
  { value: "thirty", label: "30s", duration: 30, profit: 50, displayLabel: "30s" },
  { value: "sixty", label: "60s", duration: 60, profit: 60, displayLabel: "60s" },
  { value: "two-min", label: "120s", duration: 120, profit: 70, displayLabel: "2m" },
  { value: "four-min", label: "240s", duration: 240, profit: 80, displayLabel: "4m" },
  { value: "six-min", label: "360s", duration: 360, profit: 90, displayLabel: "6m" },
  { value: "one-day", label: "1 Day", duration: 86400, profit: 150, displayLabel: "1 Day" },
  { value: "two-day", label: "2 Days", duration: 172800, profit: 250, displayLabel: "2 Days" },
  { value: "three-day", label: "3 Days", duration: 259200, profit: 350, displayLabel: "3 Days" },
];

export default function TradingForm({
  pair,
  direction,
  onSubmit,
  onClose,
  variant = "default",
}) {
  const [selectedTime, setSelectedTime] = useState("thirty");
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
      <div className="space-y-3">
        <Label>Select Duration</Label>
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max sm:grid sm:grid-cols-4 sm:min-w-0">
            {TIME_OPTIONS.map((option) => {
              const isSelected = selectedTime === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedTime(option.value)}
                  className={`
                    flex-shrink-0 w-[80px] sm:w-auto p-3 rounded-lg border-2 transition-all text-sm font-medium
                    ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-secondary"
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="font-semibold text-xs sm:text-sm">{option.displayLabel}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.profit}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-3 bg-secondary rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-sm">
            <span className="text-muted-foreground">Selected:</span>
            <span className="font-semibold">
              {getTimeDetails().displayLabel} - {getTimeDetails().profit}% Profit
            </span>
          </div>
        </div>
      </div>

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
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expected Profit:</span>
              <span className="font-semibold text-green-500">+${expectedProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Return:</span>
              <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatDuration(getTimeDetails().duration)}</span>
              </div>
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
