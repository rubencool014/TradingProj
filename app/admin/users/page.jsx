// app/admin/users/page.jsx

"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCcw } from "lucide-react";
import { UserActionsCell } from "@/components/admin/user-actions-cell";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        balance: {
          usd: parseFloat(doc.data().balance?.usd || 0).toFixed(2),
        },
      }));
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setLoading(true);
    // The onSnapshot will automatically refresh the data
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Email or UID..."
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Credit Score</TableHead>
              <TableHead>Changed Balance</TableHead>
              <TableHead>Changed Credit Score</TableHead>
              <TableHead>Activities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.userId}</TableCell>
                <TableCell>${user.balance.usd}</TableCell>
                <TableCell>{user.creditScore}</TableCell>
                <TableCell>
                  {user.balanceChanges?.map((change, index) => (
                    <div
                      key={index}
                      className={change < 0 ? "text-red-500" : "text-green-500"}
                    >
                      {change > 0 ? "+" : ""} ${parseFloat(change).toFixed(2)}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {user.creditScoreChanges?.map((change, index) => (
                    <div
                      key={index}
                      className={change < 0 ? "text-red-500" : "text-green-500"}
                    >
                      {change > 0 ? "+" : ""}
                      {change}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <UserActionsCell user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
