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

const navItems = [
  { name: "Dashboard", href: "/admin", icon: BarChart2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Vendors", href: "/admin/vendors", icon: Store },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="en">
      <body
      // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <aside
            className={`bg-white w-64 min-h-screen p-4 ${
              isSidebarOpen ? "block" : "hidden"
            } md:block`}
          >
            <nav className="mt-8">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`flex items-center px-4 py-2 mt-2 text-gray-600 rounded-lg hover:bg-gray-200 ${
                      pathname === item.href ? "bg-gray-200" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                  <span className="text-sm text-gray-500 mr-2">
                    Welcome, Admin
                  </span>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    Logout
                  </Button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
