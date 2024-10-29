"use client";

import React, { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, addDoc, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import toast from "react-hot-toast";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  inStock: string;
  category: string;
  cost: string;
}

interface ValidationErrors {
  name: string;
  description: string;
  price: string;
  inStock: string;
  category: string;
  cost: string;
  image: string;
}

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food",
  "Beverages",
  "Home & Garden",
  "Sports",
  "Books",
  "Other",
];

export default function AddProductModal({
  isOpen,
  onClose,
  storeId,
  storeName,
}: AddProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    inStock: "",
    category: "",
    cost: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    name: "",
    description: "",
    price: "",
    inStock: "",
    category: "",
    cost: "",
    image: "",
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      name: "",
      description: "",
      price: "",
      inStock: "",
      category: "",
      cost: "",
      image: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    if (
      !formData.price ||
      isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      newErrors.price = "Please enter a valid price";
      isValid = false;
    }

    if (
      !formData.cost ||
      isNaN(Number(formData.cost)) ||
      Number(formData.cost) <= 0
    ) {
      newErrors.cost = "Please enter a valid cost";
      isValid = false;
    }

    if (
      !formData.inStock ||
      isNaN(Number(formData.inStock)) ||
      Number(formData.inStock) < 0
    ) {
      newErrors.inStock = "Please enter a valid stock quantity";
      isValid = false;
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
      isValid = false;
    }

    if (!imageFile) {
      newErrors.image = "Product image is required";
      isValid = false;
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          image: "Image must be less than 5MB",
        }));
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setValidationErrors((prev) => ({
        ...prev,
        image: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Upload image
      let imageUrl = "";
      if (imageFile) {
        const imageRef = ref(
          storage,
          `productImages/${storeId}/${imageFile.name}-${Date.now()}`
        );
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Add product to products collection
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        cost: Number(formData.cost),
        inStock: Number(formData.inStock),
        category: formData.category,
        storeId,
        storeName,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      // Add the product and get its reference
      const productRef = await addDoc(collection(db, "products"), productData);

      // Update the store document with the new product reference
      const storeRef = doc(db, "stores", storeId);
      const storeDoc = await getDoc(storeRef);
      
      if (storeDoc.exists()) {
        // Update the store with the new product reference
        await updateDoc(storeRef, {
          products: arrayUnion({
            productId: productRef.id,
            name: productData.name,
            price: productData.price,
            imageUrl: productData.imageUrl,
            category: productData.category,
            inStock: productData.inStock
          })
        });
      }

      toast.success("Product added successfully");
      onClose();

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        inStock: "",
        category: "",
        cost: "",
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to {storeName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter product name"
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter product description"
              className={validationErrors.description ? "border-red-500" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500">
                {validationErrors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Bought For(Stock) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                className={validationErrors.price ? "border-red-500" : ""}
              />
              {validationErrors.price && (
                <p className="text-sm text-red-500">{validationErrors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Sell For(each) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                placeholder="0.00"
                className={validationErrors.cost ? "border-red-500" : ""}
              />
              {validationErrors.cost && (
                <p className="text-sm text-red-500">{validationErrors.cost}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inStock">Stock Quantity *</Label>
              <Input
                id="inStock"
                type="number"
                value={formData.inStock}
                onChange={(e) =>
                  setFormData({ ...formData, inStock: e.target.value })
                }
                placeholder="0"
                className={validationErrors.inStock ? "border-red-500" : ""}
              />
              {validationErrors.inStock && (
                <p className="text-sm text-red-500">
                  {validationErrors.inStock}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger
                  className={validationErrors.category ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="text-sm text-red-500">
                  {validationErrors.category}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Product Image *</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={validationErrors.image ? "border-red-500" : ""}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 max-h-40 object-contain"
              />
            )}
            {validationErrors.image && (
              <p className="text-sm text-red-500">{validationErrors.image}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}