"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function ManageAdmins() {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setDoc(doc(db, "admins", uid), {
        email,
        role: "admin",
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Admin added successfully",
      });

      setEmail("");
      setUid("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User UID</label>
              <Input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="Firebase User UID"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
