"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackDialog({ open, onOpenChange }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        userName: userData?.name || user.displayName || "Unknown User",
        userEmail: userData?.email || user.email || "Unknown Email",
        feedback: feedback.trim(),
        createdAt: new Date().toISOString(),
        status: "new",
      });

      toast({
        title: "Success!",
        description: "Your feedback has been submitted successfully. Thank you!",
      });

      setFeedback("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[420px] max-h-[90vh] m-4 sm:m-6 mx-auto">
        <DialogHeader className="px-4 sm:px-5">
          <DialogTitle className="text-lg sm:text-xl">Submit Feedback</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            We'd love to hear your thoughts! Please share your feedback below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="space-y-4 py-4 px-4 sm:px-5 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm sm:text-base">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Enter your feedback here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                className="resize-none text-sm sm:text-base min-h-[120px] sm:min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 px-4 sm:px-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto order-1 sm:order-2">
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

