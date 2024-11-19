import React, { useState, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food",
  "Books",
  "Home & Garden",
  "Toys",
  "Sports",
  "Other",
];

interface Product {
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdate,
}: {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: (updatedProduct: Product) => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || CATEGORIES[0],
    price: product?.price?.toString() || "0.00",
    cost: product?.cost?.toString() || "0.00",
    inStock: product?.inStock?.toString() || "0",
    imageUrl: product?.imageUrl || "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WEBP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}_${imageFile.name}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const price = parseFloat(formData.price);
      const cost = parseFloat(formData.cost);
      const inStock = parseInt(formData.inStock);

      if (isNaN(price) || isNaN(cost) || isNaN(inStock)) {
        toast.error("Please enter valid numbers for price, cost, and stock.");
        setIsLoading(false);
        return;
      }

      const productRef = doc(db, "products", product.id);
      const updatedData = {
        name: formData.name.trim(),
        category: formData.category,
        price,
        cost,
        inStock,
        imageUrl,
      };

      await updateDoc(productRef, updatedData);

      onProductUpdate({
        ...product,
        ...updatedData,
      });

      toast.success("Product updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inStock">In Stock</Label>
            <Input
              id="inStock"
              type="number"
              value={formData.inStock}
              onChange={(e) => handleInputChange("inStock", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Change Image
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
