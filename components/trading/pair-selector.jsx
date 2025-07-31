"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { tradingPairs } from "@/utils/trading-pairs";

export default function PairSelector({ onPairChange, value }) {
  const handlePairChange = (value) => {
    const pair = tradingPairs.find((p) => p.wsSymbol === value);
    onPairChange(pair);
  };

  return (
    <Select value={value?.wsSymbol} onValueChange={handlePairChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {tradingPairs.map((pair) => (
          <SelectItem key={pair.wsSymbol} value={pair.wsSymbol}>
            <div className="flex items-center gap-2">
              <img
                src={pair.logo}
                alt={pair.name}
                className="w-5 h-5"
                width={20}
                height={20}
              />
              <span>
                {pair.symbol} - {pair.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
