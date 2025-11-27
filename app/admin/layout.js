// app/admin/layout.js
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/admin/sidebar";
import Navbar from "@/components/admin/navbar";
import Image from "next/image";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user && !isSignInPage) {
        router.push("/sign-in");
        setLoading(false);
        return;
      }

      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (!adminDoc.exists() && !isSignInPage) {
            router.push("/sign-in");
          } else {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          if (!isSignInPage) {
            router.push("/sign-in");
          }
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, isSignInPage]);

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

  // Show sign in page without layout
  if (isSignInPage) {
    return children;
  }

  // Show admin layout only if user is authenticated and is an admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)] pt-16" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:pl-64" style={{width:'100%'}} suppressHydrationWarning>{children}</main>
      </div>
    </div>
  );
}
