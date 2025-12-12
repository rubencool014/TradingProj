"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
import { getNames } from "country-list";
import { useToast } from "@/hooks/use-toast";

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

export default function CompleteProfile() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUserEmail(user.email || "");

      // Check if profile is already complete
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Check if all required fields are present
          if (
            userData.fullName &&
            userData.username &&
            userData.gender &&
            userData.country &&
            userData.securityQuestion &&
            userData.securityAnswer
          ) {
            // Profile is complete, redirect to home
            router.push("/");
            return;
          }

          // Pre-fill existing data
          if (userData.fullName) setFullName(userData.fullName);
          if (userData.username) setUsername(userData.username);
          if (userData.gender) setGender(userData.gender);
          if (userData.country) setCountry(userData.country);
          if (userData.securityQuestion) setSecurityQuestion(userData.securityQuestion);
          if (userData.securityAnswer) setSecurityAnswer(userData.securityAnswer);
          if (userData.referralCode) setReferralCode(userData.referralCode);
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

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

  const handleSubmit = async (e) => {
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

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Final username check before updating
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username.toLowerCase())
      );
      const snapshot = await getDocs(usernameQuery);
      if (!snapshot.empty && snapshot.docs[0].id !== user.uid) {
        setError("Username is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      // Update user document
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: fullName.trim(),
          username: username.toLowerCase().trim(),
          name: fullName.trim(), // Keep for backward compatibility
          gender,
          country,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
          referralCode: referralCode.trim() || null,
        },
        { merge: true }
      );

      toast({
        title: "Profile Updated",
        description: "Your profile has been completed successfully!",
      });

      router.push("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide the following information to complete your account setup
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email is linked to your Google account
                </p>
              </div>

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
                      className={
                        usernameAvailable === false
                          ? "border-red-500"
                          : usernameAvailable === true
                          ? "border-green-500"
                          : ""
                      }
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {username && !checkingUsername && usernameAvailable === true && (
                      <span className="absolute right-3 top-2.5 text-green-500 text-xs">
                        ✓ Available
                      </span>
                    )}
                    {username && !checkingUsername && usernameAvailable === false && (
                      <span className="absolute right-3 top-2.5 text-red-500 text-xs">
                        ✗ Taken
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 3 characters, letters, numbers, and underscores only
                  </p>
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

                <div className="space-y-2 md:col-span-2">
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
                <Select
                  value={securityQuestion}
                  onValueChange={setSecurityQuestion}
                  required
                >
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || checkingUsername || usernameAvailable === false}
              >
                {loading ? "Updating Profile..." : "Complete Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

