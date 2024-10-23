"use client";

import React, { useState, useEffect } from "react";
import { collection, getDoc, getDocs, doc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Calendar, User, DollarSign, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

interface StoreData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  createdBy: string;
  vendorIds: string[];
}

interface ProductData {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  inStock: number;
  imageUrl: string;
  createdAt: string;
  createdBy: string;
}

export default function StoreDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStoreAndProducts() {
      if (!params.id) {
        setError("Store ID is required");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch store details
        const storeRef = doc(db, "stores", String(params.id));
        const storeDoc = await getDoc(storeRef);
        
        if (!storeDoc.exists()) {
          setError("Store not found");
          return;
        }

        const storeData = {
          id: storeDoc.id,
          ...storeDoc.data()
        } as StoreData;
        setStore(storeData);

        // Fetch products for this store
        const productsRef = collection(db, "products");
        const productsQuery = query(
          productsRef,
          where("storeId", "==", String(params.id))
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as ProductData[];
        setProducts(productsData);

      } catch (err) {
        console.error("Error fetching store details:", err);
        setError("Failed to fetch store details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStoreAndProducts();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl font-semibold text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Store Details Section */}
      <div className="mb-12">
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <img
            src={store.imageUrl}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{store.name}</h1>
            <p className="text-gray-600 mb-4">{store.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2" />
                Created on {format(new Date(store.createdAt), 'PPP')}
              </div>
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2" />
                {store.vendorIds.length} Vendor(s)
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Store Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Total Products
                  </span>
                  <span className="font-semibold">{products.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Total Stock
                  </span>
                  <span className="font-semibold">
                    {products.reduce((sum, product) => sum + product.inStock, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Avg. Margin
                  </span>
                  <span className="font-semibold">
                    {products.length > 0
                      ? `${(
                          (products.reduce(
                            (sum, product) => sum + (product.price - product.cost),
                            0
                          ) /
                            products.length) *
                          100
                        ).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Products</h2>
        
        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                This store doesn't have any products listed yet.
              </p>
              <Button className="flex items-center mx-auto">
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <div className="aspect-square relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold">${product.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Stock</span>
                      <span className="font-semibold">{product.inStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margin</span>
                      <span className="font-semibold">
                        {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}