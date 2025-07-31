"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to trades page by default
    router.push("/admin/trades");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      Redirecting to admin dashboard...
    </div>
  );
}
