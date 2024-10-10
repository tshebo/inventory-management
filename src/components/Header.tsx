"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  Calendar,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Menu,
} from "lucide-react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/logouts";
import { useAuth } from "@/hooks/auth";
import Spinner from "@/components/Spinner";
import { Toaster } from "react-hot-toast";

function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const logout = useLogout();
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) {
      <Spinner />;
    } else {
      const { success } = await logout();
      if (success) {
        router.push("/");
        console.log("Logged out successfully");
      }
    }
  };
  return (
    <div className=" ">
      {/* Top bar */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Admin Dashboard
          </h1>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Welcome, {role}</span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
