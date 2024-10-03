"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ShoppingBag,
  Calendar,
  Store,
  BarChart2,
  Settings,
  Menu,
} from "lucide-react";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: BarChart2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Vendors", href: "/admin/vendors", icon: Store },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Vendors
                  </CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">567</div>
                  <p className="text-xs text-muted-foreground">
                    +15.5% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Upcoming Events
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Next 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Products
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3,456</div>
                  <p className="text-xs text-muted-foreground">
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Tabs defaultValue="users" className="w-full">
                <TabsList>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="vendors">Vendors</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="search-users">Search Users:</Label>
                          <Input
                            id="search-users"
                            placeholder="Enter name or email"
                          />
                          <Button>Search</Button>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">User List</h3>
                          {/* Add user list table or grid here */}
                          <p className="text-muted-foreground">
                            User list will be displayed here.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="vendors">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="search-vendors">
                            Search Vendors:
                          </Label>
                          <Input
                            id="search-vendors"
                            placeholder="Enter vendor name"
                          />
                          <Button>Search</Button>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Vendor List</h3>
                          {/* Add vendor list table or grid here */}
                          <p className="text-muted-foreground">
                            Vendor list will be displayed here.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="search-events">Search Events:</Label>
                          <Input
                            id="search-events"
                            placeholder="Enter event name or date"
                          />
                          <Button>Search</Button>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Event List</h3>
                          {/* Add event list table or grid here */}
                          <p className="text-muted-foreground">
                            Event list will be displayed here.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Label htmlFor="search-products">
                            Search Products:
                          </Label>
                          <Input
                            id="search-products"
                            placeholder="Enter product name"
                          />
                          <Button>Search</Button>
                        </div>
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">Product List</h3>
                          {/* Add product list table or grid here */}
                          <p className="text-muted-foreground">
                            Product list will be displayed here.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
