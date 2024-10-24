"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  Calendar,
  User,
  ShoppingCart,
  Pencil,
  Trash2,
  Currency,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditStoreModal from "./EditStoreModal";
import EditProductModal from "@/components/EditProduct";
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
  description: string;
  price: number;
  inStock: number;
  storeId: string;
  storeName?: string;
  category: string;
  cost: number;
  imageUrl: string;
}

export default function StoreDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(
    null
  );

  useEffect(() => {
    async function fetchStoreAndProducts() {
      if (!params.id) {
        setError("Store ID is required");
        setIsLoading(false);
        return;
      }

      try {
        const storeRef = doc(db, "stores", String(params.id));
        const storeDoc = await getDoc(storeRef);

        if (!storeDoc.exists()) {
          setError("Store not found");
          return;
        }

        const storeData = {
          id: storeDoc.id,
          ...storeDoc.data(),
        } as StoreData;
        setStore(storeData);

        const productsRef = collection(db, "products");
        const productsQuery = query(
          productsRef,
          where("storeId", "==", String(params.id))
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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

  const handleStoreUpdate = (updatedStore: StoreData) => {
    setStore(updatedStore);
  };

  const handleProductUpdate = (updatedProduct: ProductData) => {
    setProducts(
      products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleDeleteStore = async () => {
    if (!store) return;

    setIsDeleting(true);
    try {
      // Delete all products first
      await Promise.all(
        products.map((product) => deleteDoc(doc(db, "products", product.id)))
      );

      // Then delete the store
      await deleteDoc(doc(db, "stores", store.id));

      router.push("/admin/stores"); // Redirect to stores list
    } catch (err) {
      console.error("Error deleting store:", err);
      setError("Failed to delete store");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product");
    }
  };

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
    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Store Details Section */}
      <div className="mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {store.name}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Store</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete Store</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Store</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this store? This action
                    cannot be undone and will also delete all products
                    associated with this store.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteStore}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Store
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="relative aspect-video sm:aspect-[16/9] rounded-lg overflow-hidden">
              <img
                src={store.imageUrl}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">{store.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    Created on {format(new Date(store.createdAt), "PPP")}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <User className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    {store.vendorIds.length} Vendor(s)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Store Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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
                    {products.reduce(
                      (sum, product) => sum + product.inStock,
                      0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Currency className="h-5 w-5 mr-2" />
                    Avg. Margin
                  </span>
                  <span className="font-semibold">
                    {products.length > 0
                      ? `${(
                          products.reduce(
                            (sum, product) =>
                              sum +
                              ((product.price - product.cost) / product.price) *
                                100,
                            0
                          ) / products.length
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Products
          </h2>
          <Button
            onClick={() => router.push(`/admin/products/add`)}
            className="w-full sm:w-auto justify-center"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {products.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                This store doesn&apos;t have any products listed yet.
              </p>
              <Button
                className="flex items-center mx-auto"
                onClick={() => router.push(`admin/products/add`)}
              >
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                      <span className="font-semibold">R{product.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Stock</span>
                      <span className="font-semibold">{product.inStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margin</span>
                      <span className="font-semibold">
                        {(
                          ((product.price - product.cost) / product.price) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="flex-1">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {product.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Product
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Edit Store Modal */}
      {store && (
        <EditStoreModal
          store={store}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onStoreUpdate={handleStoreUpdate}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdate={handleProductUpdate}
        />
      )}
    </div>
  );
}
