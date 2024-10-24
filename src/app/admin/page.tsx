"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
} from "lucide-react";
import { useAuth } from "@/hooks/auth";
import Spinner from "@/components/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Function to format date
const formatDate = (date: any) => {
  return new Date(date).toLocaleDateString(); // Adjust the format as needed
};

export default function AdminDashboard() {
  // State for data with proper typing
  const [users, setUsers] = useState<any[]>([]); // Specify the type as any[]
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { role, loading } = useAuth();

  // Firebase data fetching with error handling
  useEffect(() => {
    if (!role) return;

    // if (role !== "admin") {
    //   router.push("/unauthorized");
    //   return;
    // }

    const unsubscribers: (() => void)[] = []; // Explicitly define the type

    const setupSubscription = (
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      orderByField: string = "createdAt"
    ) => {
      try {
        const collectionQuery = query(
          collection(db, collectionName),
          orderBy(orderByField, "desc")
        );

        const unsubscribe = onSnapshot(
          collectionQuery,
          (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt:
                doc.data().createdAt?.toDate?.() || doc.data().createdAt,
              date: doc.data().date?.toDate?.() || doc.data().date,
            }));
            setter(data);
          },
          (error) => {
            console.error(`Error in ${collectionName} subscription:`, error);
            setError(error.message);
          }
        );

        unsubscribers.push(unsubscribe);
      } catch (err) {
        console.error(`Error setting up ${collectionName} subscription:`, err);
        setError((err as Error).message); // Type assertion to Error
      }
    };

    // Setup all subscriptions
    setupSubscription("users", setUsers);
    setupSubscription("stores", setStores);
    setupSubscription("products", setProducts);
    setupSubscription("events", setEvents, "date");

    setIsLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, [role, router]);

  // Memoized filter function
  const filterData = useMemo(
    () => (data: any[], type: string) => {
      // Specify types for parameters

      if (!data) return [];

      let filtered = data;

      // Apply search term
      if (searchTerm) {
        filtered = filtered.filter((item) =>
          Object.entries(item).some(
            ([key, value]) =>
              ["name", "email", "description"].includes(key) &&
              value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      // Apply specific filters
      if (selectedFilter !== "all") {
        switch (type) {
          case "users":
            filtered = filtered.filter((user) => user.role === selectedFilter);
            break;
          case "events":
            filtered = filtered.filter(
              (event) => event.status === selectedFilter
            );
            break;
          case "products":
            filtered = filtered.filter(
              (product) => product.category === selectedFilter
            );
            break;
        }
      }

      return filtered;
    },
    [searchTerm, selectedFilter]
  );

  // Memoized analytics calculations
  const analytics = useMemo(
    () => ({
      users: {
        total: users.length,
        growth: users.length
          ? (
              (users.filter((u) => {
                const date =
                  u.createdAt instanceof Date
                    ? u.createdAt
                    : new Date(u.createdAt);
                return date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              }).length /
                users.length) *
              100
            ).toFixed(1)
          : 0,
      },
      stores: {
        total: stores.length,
        activeVendors: stores.filter(
          (s) => Array.isArray(s.vendorIds) && s.vendorIds.length > 0
        ).length,
      },
      events: {
        upcoming: events.filter((e) => new Date(e.date) > new Date()).length,
        active: events.filter((e) => e.status === "active").length,
      },
      products: {
        total: products.length,
        inStock: products.filter((p) => (p.inStock || 0) > 0).length,
        lowStock: products.filter((p) => (p.inStock || 0) > 0 && p.inStock < 10)
          .length,
      },
    }),
    [users, stores, events, products]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };
  // Memoized categories
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products]
  );

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6">
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardContent>{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (loading || isLoading) {
    return <Spinner />;
  }

  if (role !== "admin") {
    router.push("/unauthorized");
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.users.total}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.users.growth}% from last month
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
                  <div className="text-2xl font-bold">
                    {analytics.stores.activeVendors}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(
                      (analytics.stores.activeVendors /
                        analytics.stores.total) *
                      100
                    ).toFixed(1)}
                    % of total stores
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
                  <div className="text-2xl font-bold">
                    {analytics.events.upcoming}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.events.active} currently active
                  </p>
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
                  <div className="text-2xl font-bold">
                    {analytics.products.total}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.products.inStock} in stock
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="users" className="w-full">
                <TabsList>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="vendors">Stores</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Input
                              placeholder="Search by name or email"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="w-48">
                            <Select
                              value={selectedFilter}
                              onValueChange={setSelectedFilter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="vendor">Vendor</SelectItem>
                                <SelectItem value="customer">
                                  Customer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Created At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterData(users, "users").map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.credits}</TableCell>
                                <TableCell>
                                  {new Date(
                                    user.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Vendors Tab */}
                <TabsContent value="vendors">
                  <Card>
                    <CardHeader>
                      <CardTitle>Store Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Input
                            placeholder="Search stores"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Vendors</TableHead>
                              <TableHead>Created At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterData(stores, "stores").map((store) => (
                              <TableRow key={store.id}>
                                <TableCell>{store.name}</TableCell>
                                <TableCell>{store.description}</TableCell>
                                <TableCell>
                                  {store.vendorIds?.length || 0}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    store.createdAt
                                  ).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Input
                              placeholder="Search events"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="w-48">
                            <Select
                              value={selectedFilter}
                              onValueChange={setSelectedFilter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Schedule</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterData(events, "events").map((event) => (
                              <TableRow key={event.id}>
                                <TableCell>{event.name}</TableCell>
                                <TableCell>
                                  {new Date(event.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell>{event.status}</TableCell>
                                <TableCell>
                                  {event.schedule.startTime} -{" "}
                                  {event.schedule.endTime}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Input
                              placeholder="Search products"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="w-48">
                            <Select
                              value={selectedFilter}
                              onValueChange={setSelectedFilter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Filter by category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Categories
                                </SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Created At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterData(products, "products").map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.name || "N/A"}</TableCell>
                                <TableCell>
                                  {product.category || "N/A"}
                                </TableCell>
                                <TableCell>R{product.price}</TableCell>
                                <TableCell>R{product.cost}</TableCell>
                                <TableCell>
                                  <span
                                    className={`${
                                      (product.inStock || 0) < 10
                                        ? "text-red-500"
                                        : (product.inStock || 0) < 50
                                        ? "text-yellow-500"
                                        : "text-green-500"
                                    }`}
                                  >
                                    {product.inStock || 0}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {formatDate(product.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
