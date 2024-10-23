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
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/logouts";
import { useAuth } from "@/hooks/auth";
import Spinner from "@/components/Spinner";
import { Toaster } from "react-hot-toast";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: BarChart2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Stores", href: "/admin/stores", icon: Store },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
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
    if (!loading) {
      const { success } = await logout();
      if (success) {
        router.push("/");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full transform bg-white transition-transform lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : ""
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <span className="text-xl font-semibold">Admin Panel</span>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4">
          {children}
          <Toaster />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}