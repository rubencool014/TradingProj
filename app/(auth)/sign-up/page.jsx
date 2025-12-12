"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { updateSessionCookie, createOrUpdateUserDocument } from "@/utils/auth";
import { getNames } from "country-list";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your childhood nickname?",
  "What is your favorite movie?",
  "What was the make of your first car?",
  "What is the name of your best friend?",
  "What is your favorite food?",
  "What was the name of your first teacher?",
];

// Get all country names from the library and sort them alphabetically
const countryNames = getNames();
const COUNTRIES = Object.values(countryNames).sort();

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  
  // Configure Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Check username uniqueness
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      // Basic validation
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameAvailable(false);
        setError("Username can only contain letters, numbers, and underscores");
        return;
      }

      setCheckingUsername(true);
      try {
        const usernameQuery = query(
          collection(db, "users"),
          where("username", "==", username.toLowerCase())
        );
        const snapshot = await getDocs(usernameQuery);
        setUsernameAvailable(snapshot.empty);
        if (!snapshot.empty) {
          setError("Username is already taken");
        } else {
          setError("");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters long");
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError("Username is already taken");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!gender) {
      setError("Please select your gender");
      setLoading(false);
      return;
    }

    if (!country) {
      setError("Please select your country");
      setLoading(false);
      return;
    }

    if (!securityQuestion) {
      setError("Please select a security question");
      setLoading(false);
      return;
    }

    if (!securityAnswer.trim()) {
      setError("Please provide an answer to the security question");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Final username check before creating account
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username.toLowerCase())
      );
      const snapshot = await getDocs(usernameQuery);
      if (!snapshot.empty) {
        setError("Username is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Generate unique user ID starting from 0001
      const timestamp = Date.now();
      const uniqueId = `${timestamp.toString().slice(-4).padStart(4, "0")}`;

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: fullName.trim(),
        username: username.toLowerCase().trim(),
        name: fullName.trim(), // Keep for backward compatibility
        email: email.trim().toLowerCase(),
        gender,
        country,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
        referralCode: referralCode.trim() || null,
        userId: uniqueId,
        balance: {
          usd: 0,
        },
        creditScore: 100, // Initial credit score
        createdAt: new Date().toISOString(),
      });
      try {
        await sendEmailVerification(userCredential.user);
      } catch (err) {
        console.error("Error sending verification email:", err);
      }
      router.push("/verify-email");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/weak-password":
          setError("Password is too weak");
          break;
        default:
          setError("Failed to create account. Please try again.");
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
          
          // Create or update user document in Firestore
          await createOrUpdateUserDocument(user);

          // Update session cookie (this will also check admin status)
          await updateSessionCookie();
          
          // Wait a bit to ensure cookie is set before navigation
          await new Promise(resolve => setTimeout(resolve, 100));

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
        setError("Failed to complete Google sign-up. Please try again.");
      }
    };

    handleRedirectResult();
  }, [router]);

  const handleGoogleSignUp = async () => {
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

      // Check if user is admin for routing
      const adminDoc = await getDoc(doc(db, "admins", user.uid));
      const isAdmin = adminDoc.exists();

      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Google sign-up error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-up popup was closed. Please try again.");
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
        setError(`Failed to sign up with Google: ${error.message || "Please try again."}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe123"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className={usernameAvailable === false ? "border-red-500" : usernameAvailable === true ? "border-green-500" : ""}
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {username && !checkingUsername && usernameAvailable === true && (
                      <span className="absolute right-3 top-2.5 text-green-500 text-xs">✓ Available</span>
                    )}
                    {username && !checkingUsername && usernameAvailable === false && (
                      <span className="absolute right-3 top-2.5 text-red-500 text-xs">✗ Taken</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 3 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
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
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={gender} onValueChange={setGender} required>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry} required>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {COUNTRIES.map((countryName) => (
                        <SelectItem key={countryName} value={countryName}>
                          {countryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityQuestion">Security Question *</Label>
                <Select value={securityQuestion} onValueChange={setSecurityQuestion} required>
                  <SelectTrigger id="securityQuestion">
                    <SelectValue placeholder="Select a security question" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {SECURITY_QUESTIONS.map((question, index) => (
                      <SelectItem key={index} value={question}>
                        {question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityAnswer">Security Answer *</Label>
                <Input
                  id="securityAnswer"
                  type="text"
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={confirmPassword && password !== confirmPassword ? "border-red-500" : confirmPassword && password === confirmPassword ? "border-green-500" : ""}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-500">Passwords match</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={loading || checkingUsername || usernameAvailable === false}>
                {loading ? "Creating account..." : "Create account"}
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
                onClick={handleGoogleSignUp}
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
                {googleLoading ? "Signing up..." : "Sign up with Google"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
