"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ShoppingBag, BarChart2, DollarSign } from "lucide-react";
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

interface Store {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  products: Product[];
  vendorIds: string[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  inStock: number;
  imageUrl: string;
  createdAt: string;
  storeId?: string;
  storeName?: string;
}

interface VendorMetrics {
  totalRevenue: number;
  totalProducts: number;
  averageMargin: number;
  lowStockItems: number;
}

export default function VendorDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!user?.uid || !role) return;

    if (role !== "vendor") {
      router.push("/unauthorized");
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Fetch stores where vendor is assigned
    const storesQuery = query(
      collection(db, "stores"),
      where("vendorIds", "array-contains", user.uid)
    );

    const storesUnsubscribe = onSnapshot(
      storesQuery,
      (snapshot) => {
        const storesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Store[];
        setStores(storesData);

        // Collect all products from all stores
        const allProducts = storesData.flatMap((store) =>
          (store.products || []).map(product => ({
            ...product,
            storeId: store.id,
            storeName: store.name
          }))
        );
        setProducts(allProducts);
      },
      (error) => {
        console.error("Error fetching stores:", error);
        setError(error.message);
      }
    );

    unsubscribers.push(storesUnsubscribe);
    setIsLoading(false);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user, role, router]);

  const metrics: VendorMetrics = useMemo(() => {
    const totalRevenue = products.reduce((sum, product) => sum + (product.price * product.inStock), 0);
    const totalCost = products.reduce((sum, product) => sum + (product.cost * product.inStock), 0);

    return {
      totalRevenue: totalRevenue,
      totalProducts: products.length,
      averageMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0,
      lowStockItems: products.filter(p => p.inStock < 10).length
    };
  }, [products]);

  const filterData = useMemo(
    () => (data: any[], type: string) => {
      if (!data) return [];

      let filtered = data;

      if (searchTerm) {
        filtered = filtered.filter((item) =>
          Object.entries(item).some(
            ([key, value]) =>
              ["name", "category", "description"].includes(key) &&
              value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      if (selectedFilter !== "all") {
        if (type === "products") {
          filtered = filtered.filter(
            (product) => product.category === selectedFilter
          );
        }
      }

      return filtered;
    },
    [searchTerm, selectedFilter]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  if (loading || isLoading) return <Spinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Vendor Analytics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stores.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.lowStockItems} items low in stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="stores" className="space-y-4">
            <TabsList>
              <TabsTrigger value="stores">My Stores</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="stores">
              <Card>
                <CardHeader>
                  <CardTitle>Store Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterData(stores, "stores").map((store) => (
                          <TableRow key={store.id}>
                            <TableCell>{store.name}</TableCell>
                            <TableCell>{store.description}</TableCell>
                            <TableCell>{store.products?.length || 0}</TableCell>
                            <TableCell>
                              {formatCurrency(
                                store.products?.reduce(
                                  (sum: number, product: Product) => sum + (product.price || 0) * (product.inStock || 0),
                                  0
                                ) || 0
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Product Management</CardTitle>
                  <div className="flex justify-end">
                    <Select onValueChange={setSelectedFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="category1">Category 1</SelectItem>
                        <SelectItem value="category2">Category 2</SelectItem>
                        {/* Add more categories as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>In Stock</TableHead>
                        <TableHead>Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
  {filterData(products, "products").map((product) => {
    const productPrice = product.price || 0;  // Default to 0 if undefined
    const productCost = product.cost || 0;    // Default to 0 if undefined
    const inStock = product.inStock >= 0 ? product.inStock : 0; // Ensure inStock is non-negative

    // Calculate margin percentage safely
    const margin = productPrice > 0 && productCost >= 0 
      ? (((productPrice - productCost) / productPrice) * 100).toFixed(1) 
      : 0;

    return (
      <TableRow key={product.productId}>
        <TableCell>{product.name}</TableCell>
        <TableCell>{product.storeName}</TableCell>
        <TableCell>{product.category}</TableCell>
        <TableCell>{formatCurrency(productPrice)}</TableCell>
        <TableCell>{formatCurrency(productCost)}</TableCell>
        <TableCell>
          <span className={`${inStock < 10 ? "text-red-500" : inStock < 50 ? "text-yellow-500" : "text-green-500"}`}>
            {inStock}
          </span>
        </TableCell>
        <TableCell>{margin}%</TableCell>
      </TableRow>
    );
  })}
</TableBody>

                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
