"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { updateSessionCookie, createOrUpdateUserDocument, isProfileComplete } from "@/utils/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Configure Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // If email not verified, send verification and route to verify page
      await userCredential.user.reload();
      if (!userCredential.user.emailVerified) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (err) {
          console.error("Error sending verification email:", err);
        }
        setError("Please verify your email to continue. We just sent a verification email.");
        router.push("/verify-email");
        setLoading(false);
        return;
      }

      // Update session cookie (this will also check admin status)
      await updateSessionCookie();
      
      // Wait a bit to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if user is admin for routing
      const adminDoc = await getDoc(doc(db, "admins", userCredential.user.uid));
      const isAdmin = adminDoc.exists();

      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
          setError("No account exists with this email address");
          break;
        case "auth/wrong-password":
          setError("Invalid password");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        default:
          setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect result when returning from Google OAuth
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          await user.reload();
          if (!user.emailVerified) {
            try {
              await sendEmailVerification(user);
            } catch (err) {
              console.error("Error sending verification email:", err);
            }
            setError("Please verify your email to continue. We just sent a verification email.");
            router.push("/verify-email");
            return;
          }
          
          // Create or update user document in Firestore
          await createOrUpdateUserDocument(user);

          // Update session cookie (this will also check admin status)
          await updateSessionCookie();
          
          // Wait a bit to ensure cookie is set before navigation
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check if profile is complete
          const profileComplete = await isProfileComplete(user.uid);
          if (!profileComplete) {
            router.push("/complete-profile");
            return;
          }

          // Check if user is admin for routing
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          const isAdmin = adminDoc.exists();

          if (isAdmin) {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        setError("Failed to complete Google sign-in. Please try again.");
      }
    };

    handleRedirectResult();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      // Try popup first, fallback to redirect if popup fails
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupError) {
        // If popup is blocked or fails, use redirect
        if (popupError.code === "auth/popup-blocked" || popupError.code === "auth/popup-closed-by-user") {
          // Use redirect method for production
          await signInWithRedirect(auth, googleProvider);
          // Don't set loading to false here as redirect will navigate away
          return;
        }
        throw popupError;
      }

      const user = result.user;

      // Create or update user document in Firestore
      await createOrUpdateUserDocument(user);

      // Update session cookie (this will also check admin status)
      await updateSessionCookie();
      
      // Wait a bit to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if profile is complete
      const profileComplete = await isProfileComplete(user.uid);
      if (!profileComplete) {
        router.push("/complete-profile");
        return;
      }

      // Check if user is admin for routing
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      const isAdmin = adminDoc.exists();

      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        // Try redirect as fallback
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // Redirect will navigate away
        } catch (redirectError) {
          setError("Popup was blocked. Please allow popups or try again.");
        }
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else if (error.code === "auth/unauthorized-domain") {
        setError("Domain not authorized in Firebase. Add 'trading-proj-eta.vercel.app' to Firebase Console → Authentication → Settings → Authorized domains");
      } else {
        setError(`Failed to sign in with Google: ${error.message || "Please try again."}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {googleLoading ? "Signing in..." : "Sign in with Google"}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Do not have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
