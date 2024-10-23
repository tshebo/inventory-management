"use client";

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Store, Plus, Eye, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";

interface StoreData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  vendorIds: string[];
}

export default function StoreGallery() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchStores() {
      try {
        const storesCollection = collection(db, "stores");
        const storesSnapshot = await getDocs(storesCollection);
        const storesData = storesSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as StoreData)
        );
        setStores(storesData);
      } catch (err) {
        setError("Failed to fetch stores");
        console.error("Error fetching stores:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStores();
  }, []);

  const handleCreateStore = () => {
    router.push("/admin/stores/add");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stores Gallery</h1>
        <Button onClick={handleCreateStore} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Create Store
        </Button>
      </div>

      {stores.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No stores yet
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by creating your first store.
            </p>
            <Button
              onClick={handleCreateStore}
              className="flex items-center mx-auto"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stores.map((store) => (
            <Card key={store.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video relative">
                <img
                  src={store.imageUrl}
                  alt={store.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{store.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {store.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between mt-auto">
                <Button variant="outline"
                
                onClick={() => {
                  // Assuming you're using Next.js
                  router.push(`/admin/stores/${store.id}`);
                }}
                  className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Button>
                <Button
                  onClick={() => {
                    // Assuming you're using Next.js
                    router.push(`/products/add?storeId=${store.id}`);
                  }}
                  className="flex items-center"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> Add Products
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
