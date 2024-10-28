'use client'
import React, { useState, useEffect, useMemo } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"; 
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Store,
  DollarSign,
  AlertCircle,
  LogOut
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inStock: number;
  storeId: string;
  storeName: string;
  category: string;
  cost: number;
  imageUrl: string;
}

interface StoreData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  createdBy: string;
  vendorIds: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "vendor" | "customer";
  createdAt: string;
  createdBy: string;
  credits: number;
}

const VendorDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user, role, loading, signOut } = useAuth() as {
    user: User | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
  };

  useEffect(() => {
    if (!user?.id || role !== "vendor") {
      setIsLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      // Fetch stores where user is a vendor
      const storesQuery = query(
        collection(db, "stores"),
        where("vendorIds", "array-contains", user.id)
      );

      const storesUnsubscribe = onSnapshot(storesQuery, (snapshot) => {
        const storesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as StoreData));
        setStores(storesData);

        // Fetch products for the vendor's stores
        const storeIds = storesData.map(store => store.id);
        const productsQuery = query(
          collection(db, "products"),
          where("storeId", "in", storeIds)
        );

        const productsUnsubscribe = onSnapshot(productsQuery, (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            storeName: storesData.find(store => store.id === doc.data().storeId)?.name
          } as Product));
          setProducts(productsData);
        });

        unsubscribers.push(productsUnsubscribe);
      });

      unsubscribers.push(storesUnsubscribe);

      setIsLoading(false);
    } catch (err) {
      console.error("Error setting up subscriptions:", err);
      setError((err as Error).message);
      setIsLoading(false);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user?.id, role]);

  const analytics = useMemo(() => ({
    stores: {
      total: stores.length,
      active: stores.filter(store => store.vendorIds?.length > 0).length
    },
    products: {
      total: products.length,
      lowStock: products.filter(p => p.inStock < 10).length,
      outOfStock: products.filter(p => p.inStock === 0).length,
      revenue: products.reduce((acc, p) => acc + (p.price * p.inStock), 0)
    }
  }), [stores, products]);

  const filterData = useMemo(() => (data: any[], type: string) => {
    if (!data) return [];

    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.entries(item).some(([key, value]) =>
          ["name", "description", "category"].includes(key) &&
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedFilter !== "all") {
      switch (type) {
        case "products":
          filtered = filtered.filter(product => product.category === selectedFilter);
          break;
      }
    }

    return filtered;
  }, [searchTerm, selectedFilter]);

  if (loading || isLoading) return <Spinner />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!user || role !== "vendor") {
    router.push("/unauthorized");
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-semibold">Vendor Dashboard</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {user?.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Stores</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.stores.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.stores.active} active stores
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.products.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.products.lowStock} low stock items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-ZA', {
                      style: 'currency',
                      currency: 'ZAR'
                    }).format(analytics.products.revenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Potential revenue from current stock
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Tabs defaultValue="products" className="w-full">
                <TabsList>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="stores">Stores</TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Input
                            placeholder="Search products"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                          />
                          <Select
                            value={selectedFilter}
                            onValueChange={setSelectedFilter}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {Array.from(new Set(products.map(p => p.category))).map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button>Add Product</Button>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Store</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterData(products, "products").map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.storeName}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat('en-ZA', {
                                    style: 'currency',
                                    currency: 'ZAR'
                                  }).format(product.price)}
                                </TableCell>
                                <TableCell>
                                  <span className={`${
                                    product.inStock === 0 ? "text-red-500" :
                                    product.inStock < 10 ? "text-yellow-500" :
                                    "text-green-500"
                                  }`}>
                                    {product.inStock}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stores">
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
                            className="flex-1"
                          />
                          <Button>Add Store</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stores.map((store) => (
                            <Card key={store.id} className="overflow-hidden">
                              <div className="aspect-video relative">
                                <img
                                  src={store.imageUrl || "/api/placeholder/400/200"}
                                  alt={store.name}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <CardHeader>
                                <CardTitle>{store.name}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                  {store.description}
                                </p>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Products:</span>
                                    <span className="font-medium">
                                      {products.filter(p => p.storeId === store.id).length}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Created:</span>
                                    <span className="font-medium">
                                      {new Date(store.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Vendors:</span>
                                    <span className="font-medium">
                                      {store.vendorIds?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {stores.length === 0 && (
                          <Card className="p-6 text-center">
                            <CardContent>
                              <div className="flex flex-col items-center space-y-4">
                                <Store className="h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-medium">No Stores Found</h3>
                                <p className="text-sm text-muted-foreground">
                                  You haven&apos;t created any stores yet. Get started by adding your first store.
                                </p>
                                <Button>Create Store</Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
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
};

export default VendorDashboard;
