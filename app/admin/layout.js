// app/admin/layout.js
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { isProfileComplete } from "@/utils/auth";
import Sidebar from "@/components/admin/sidebar";
import Navbar from "@/components/admin/navbar";
import Image from "next/image";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";
  const isCompleteProfilePage = pathname === "/complete-profile";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user && !isSignInPage) {
        router.push("/sign-in");
        setLoading(false);
        return;
      }

      if (user) {
        if (!user.emailVerified && !isCompleteProfilePage) {
          router.push("/verify-email");
          setLoading(false);
          return;
        }

        // Check if profile is complete (skip check on complete-profile page)
        if (!isCompleteProfilePage) {
          try {
            const profileComplete = await isProfileComplete(user.uid);
            if (!profileComplete) {
              router.push("/complete-profile");
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error("Error checking profile completion:", error);
          }
        }

        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (!adminDoc.exists() && !isSignInPage && !isCompleteProfilePage) {
            router.push("/sign-in");
          } else {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          if (!isSignInPage && !isCompleteProfilePage) {
            router.push("/sign-in");
          }
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, isSignInPage, isCompleteProfilePage]);

  // Show loading state
  if (loading) {
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

  // Show sign in or complete profile page without layout
  if (isSignInPage || isCompleteProfilePage) {
    return children;
  }

  // Show admin layout only if user is authenticated and is an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)] mt-16 overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 w-full overflow-y-auto" suppressHydrationWarning>
          {children}
        </main>
      </div>
    </div>
  );
}
