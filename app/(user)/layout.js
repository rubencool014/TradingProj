"use client";
import Navbar from "@/components/home/navbar";
import Sidebar from "@/components/home/sidebar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { isProfileComplete } from "@/utils/auth";
import Image from "next/image";

export default function UserLayout({ children }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isCompleteProfilePage = pathname === "/complete-profile";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        if (!isCompleteProfilePage) {
          router.push("/sign-in");
        }
        setChecking(false);
        return;
      }

      if (!user.emailVerified && !isCompleteProfilePage) {
        router.push("/verify-email");
        setChecking(false);
        return;
      }

      // Check if profile is complete (skip check on complete-profile page)
      if (!isCompleteProfilePage) {
        try {
          const profileComplete = await isProfileComplete(user.uid);
          if (!profileComplete) {
            router.push("/complete-profile");
            setChecking(false);
            return;
          }
        } catch (error) {
          console.error("Error checking profile completion:", error);
        }
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router, isCompleteProfilePage]);

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src="/main/logo.svg"
          alt="Loading"
          width={34}
          height={34}
          className="animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
      <Navbar />
      <div className="flex" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 w-full" suppressHydrationWarning>{children}</main>
      </div>
    </div>
  );
}
