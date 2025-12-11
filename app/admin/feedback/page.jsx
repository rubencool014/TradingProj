// app/admin/feedback/page.jsx

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, RefreshCcw, MessageSquare } from "lucide-react";

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const feedbackQuery = query(
      collection(db, "feedback"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbacks(feedbackList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.feedback?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setLoading(true);
    // The onSnapshot will automatically refresh the data
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">User Feedback</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback..."
              className="pl-8 w-full sm:w-[300px]"
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading feedback...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Feedback Found</CardTitle>
            <CardDescription>
              {searchQuery
                ? "No feedback matches your search criteria."
                : "No feedback has been submitted yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell className="font-medium">
                    {feedback.userName || "Unknown User"}
                  </TableCell>
                  <TableCell>{feedback.userEmail || "Unknown Email"}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {feedback.feedback}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(feedback.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && filteredFeedbacks.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredFeedbacks.length} of {feedbacks.length} feedback
          {feedbacks.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

