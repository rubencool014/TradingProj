"use client";
import Navbar from "@/components/home/navbar";
import Sidebar from "@/components/home/sidebar";

export default function UserLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pl-14 lg:pl-64" style={{width:'100%'}}>{children}</main>
      </div>
    </div>
  );
}
