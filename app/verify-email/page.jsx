"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, CheckCircle2, RefreshCw } from "lucide-react";
import Image from "next/image";

export default function VerifyEmailPage() {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }

      await user.reload();
      if (user.emailVerified) {
        router.push("/");
        return;
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSending(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch (error) {
      console.error("Error sending verification email:", error);
    } finally {
      setSending(false);
    }
  };

  const handleRefreshStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await user.reload();
    if (user.emailVerified) {
      router.push("/");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Image
          src="/main/logo.svg"
          alt="Loading"
          width={40}
          height={40}
          className="animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <CardTitle>Verify Your Email</CardTitle>
          </div>
          <CardDescription>
            Please verify your email address to continue. We&apos;ve sent a verification email to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click the verification link in your email. After verifying, click &quot;I&apos;ve Verified&quot; to continue.
            </AlertDescription>
          </Alert>

          <Alert variant="outline">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Didn&apos;t receive the email?</strong> Please check your spam folder. The verification email might have been filtered there.
            </AlertDescription>
          </Alert>

          {sent && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Verification email sent. Please check your inbox (and spam folder).
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleResend} disabled={sending} className="flex-1">
              {sending ? "Sending..." : "Resend Email"}
            </Button>
            <Button variant="outline" onClick={handleRefreshStatus} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              I&apos;ve Verified
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

