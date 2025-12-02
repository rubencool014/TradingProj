"use client";
import Navbar from "@/components/home/navbar";
import Sidebar from "@/components/home/sidebar";

export default function UserLayout({ children }) {
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
