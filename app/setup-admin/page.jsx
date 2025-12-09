"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, getDocs, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function SetupAdmin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAdmins, setHasAdmins] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if any admins exist
    const checkAdmins = async () => {
      try {
        const adminsQuery = query(collection(db, "admins"));
        const snapshot = await getDocs(adminsQuery);
        setHasAdmins(!snapshot.empty);
      } catch (error) {
        console.error("Error checking admins:", error);
      } finally {
        setChecking(false);
      }
    };

    // Check current user
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // Redirect to sign-in if not authenticated
        router.push("/sign-in");
      }
    });

    checkAdmins();

    return () => unsubscribe();
  }, [router]);

  const handleCreateFirstAdmin = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create the first admin.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create admin document with current user's UID
      await setDoc(doc(db, "admins", user.uid), {
        email: email || user.email,
        role: "admin",
        createdAt: new Date().toISOString(),
        isFirstAdmin: true,
      });

      toast({
        title: "Success!",
        description: "First admin created successfully. Redirecting to admin panel...",
      });

      // Wait a bit then redirect
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (error) {
      console.error("Error creating first admin:", error);
      toast({
        title: "Error",
        description: "Failed to create first admin. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasAdmins) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Setup Complete
            </CardTitle>
            <CardDescription>
              The first admin has already been created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                Only existing admins can add new admins. If you need to add an
                admin, please contact an existing administrator or use the
                admin panel.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => router.push("/sign-in")}
                className="w-full"
                variant="outline"
              >
                Go to Sign In
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="w-full"
                variant="outline"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup First Admin</CardTitle>
          <CardDescription>
            Create the first administrator account for your system. This can only
            be done once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!user ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You must be signed in to create the first admin. Please sign in
                first.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleCreateFirstAdmin} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  You are about to create the first admin account using your
                  current user account ({user.email}). This action cannot be
                  undone through this page.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user.email || "admin@example.com"}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This will be associated with your current account:{" "}
                  <strong>{user.email}</strong>
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  "Create First Admin"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

