"use client";
import Navbar from "@/components/home/navbar";
import Sidebar from "@/components/home/sidebar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import Image from "next/image";

export default function UserLayout({ children }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/sign-in");
        setChecking(false);
        return;
      }

      if (!user.emailVerified) {
        router.push("/verify-email");
        setChecking(false);
        return;
      }

      setChecking(false);
    });

    return () => unsubscribe();
  }, [router]);

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
