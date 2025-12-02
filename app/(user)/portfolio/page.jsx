"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import PortfolioBalance from "@/components/portfolio/portfolio-balance";
import OrderHistory from "@/components/portfolio/order-history";
import PriceChart from "@/components/portfolio/price-chart";

export default function Portfolio() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Portfolio Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <PortfolioBalance />
        <PriceChart />
      </div>

      <div className="mt-4 sm:mt-6">
        <OrderHistory />
      </div>
    </div>
  );
}
