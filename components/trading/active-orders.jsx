// components/trading/active-orders.jsx

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const activeOrdersQuery = query(
      collection(db, "trades"),
      where("userId", "==", auth.currentUser.uid),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const lastOrderQuery = query(
      collection(db, "trades"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(activeOrdersQuery, (activeSnapshot) => {
      if (activeSnapshot.empty) {
        onSnapshot(lastOrderQuery, (lastSnapshot) => {
          const trades = lastSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timeLeft: calculateTimeLeft(doc.data().endTime),
          }));
          setOrders(trades);
          setLoading(false);
        });
      } else {
        const trades = activeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timeLeft: calculateTimeLeft(doc.data().endTime),
        }));
        setOrders(trades);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((currentOrders) =>
        currentOrders.map((order) => ({
          ...order,
          timeLeft: calculateTimeLeft(order.endTime),
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (endTime) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((end - now) / 1000));
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[calc(100%-88px)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
          {orders.some((order) => order.status === "active")
            ? "Active Orders"
            : "Last Order"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground">No orders yet</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Coin</div>
                      <div className="font-medium">
                        {order.coinSlug.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Direction
                      </div>
                      <div className="flex items-center font-medium">
                        {order.direction === "up" ? (
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            UP
                          </div>
                        ) : (
                          <div className="flex items-center text-red-500">
                            <ArrowDown className="h-4 w-4 mr-1" />
                            DOWN
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Amount
                      </div>
                      <div className="font-medium">${order.amount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {order.timeLeft > 0 ? "Time Left" : "Duration"}
                      </div>
                      <div className="font-medium flex items-center">
                        {order.timeLeft > 0 ? (
                          <>
                            <Timer className="h-4 w-4 mr-1" />
                            {order.timeLeft}s
                          </>
                        ) : (
                          `${order.duration}s`
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Expected Profit
                      </div>
                      <div className="font-medium text-green-500">
                        $
                        {(
                          (order.amount * order.profitPercentage) /
                          100
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Status
                      </div>
                      <Badge
                        variant={
                          order.status === "active"
                            ? "outline"
                            : order.status === "profit"
                            ? "success"
                            : order.status === "loss"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {order.status === "active" && order.timeLeft > 0
                          ? "Active"
                          : order.status === "active" && order.timeLeft === 0
                          ? "Processing"
                          : order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/portfolio">Show Trade History</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
