"use client";

import { useState, useEffect, useRef } from "react"; // Add useState, useEffect, useRef from React
import { useSearchParams } from "next/navigation";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AlertCircle, Loader2, ImagePlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import toast from "react-hot-toast";

interface Store {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  cost: string;
  inStock: string;
  storeId: string;
  imageFile: File | null;
}

interface ValidationErrors {
  name?: string;
  category?: string;
  price?: string;
  cost?: string;
  inStock?: string;
  storeId?: string;
  image?: string;
}

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProductForm() {
  const searchParams = useSearchParams();
  const initialStoreId = searchParams.get("storeId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    category: "",
    price: "",
    cost: "",
    inStock: "",
    storeId: initialStoreId || "",
    imageFile: null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    async function fetchStores() {
      try {
        const storesSnapshot = await getDocs(collection(db, "stores"));
        const storesData = storesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setStores(storesData);

        if (initialStoreId) {
          const store = storesData.find((s) => s.id === initialStoreId);
          if (store) setSelectedStore(store);
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
        toast.error("Failed to load stores");
      }
    }
    fetchStores();
  }, [initialStoreId]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = "Product name is required";
      isValid = false;
    }

    if (!formData.category) {
      errors.category = "Category is required";
      isValid = false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = "Price must be a positive number";
      isValid = false;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      errors.cost = "Cost must be a positive number";
      isValid = false;
    }

    const inStock = parseInt(formData.inStock);
    if (isNaN(inStock) || inStock < 0) {
      errors.inStock = "In stock must be a non-negative number";
      isValid = false;
    }

    if (!formData.storeId) {
      errors.storeId = "Store selection is required";
      isValid = false;
    }

    if (!formData.imageFile) {
      errors.image = "Product image is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setValidationErrors((prev) => ({
        ...prev,
        image: "Please upload a valid image file (JPEG, PNG, or WEBP)",
      }));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors((prev) => ({
        ...prev,
        image: "Image must be less than 5MB",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      image: undefined,
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser)
        throw new Error("You must be logged in to add a product");

      let imageUrl = "";
      if (formData.imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}_${formData.imageFile.name}`
        );
        const uploadResult = await uploadBytes(imageRef, formData.imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        inStock: parseInt(formData.inStock),
        storeId: formData.storeId,
        imageUrl,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "products"), productData);
      toast.success("Product added successfully");

      // Reset form
      setFormData({
        name: "",
        category: "",
        price: "",
        cost: "",
        inStock: "",
        storeId: initialStoreId || "",
        imageFile: null,
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while adding the product");
      toast.error("Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>
            {selectedStore
              ? `Adding product to ${selectedStore.name}`
              : "Create a new product and assign it to a store"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger
                  className={validationErrors.category ? "border-red-500" : ""}
                >
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
              {validationErrors.category && (
                <p className="text-sm text-red-500">
                  {validationErrors.category}
                </p>
              )}
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
                  className={validationErrors.price ? "border-red-500" : ""}
                />
                {validationErrors.price && (
                  <p className="text-sm text-red-500">
                    {validationErrors.price}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange("cost", e.target.value)}
                  className={validationErrors.cost ? "border-red-500" : ""}
                />
                {validationErrors.cost && (
                  <p className="text-sm text-red-500">
                    {validationErrors.cost}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inStock">In Stock</Label>
              <Input
                id="inStock"
                type="number"
                value={formData.inStock}
                onChange={(e) => handleInputChange("inStock", e.target.value)}
                className={validationErrors.inStock ? "border-red-500" : ""}
              />
              {validationErrors.inStock && (
                <p className="text-sm text-red-500">
                  {validationErrors.inStock}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
                <Input
                  id="image"
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
              {validationErrors.image && (
                <p className="text-sm text-red-500">{validationErrors.image}</p>
              )}
            </div>

            {!initialStoreId && (
              <div className="space-y-2">
                <Label htmlFor="storeId">Store</Label>
                <Select
                  value={formData.storeId}
                  onValueChange={(value) => handleInputChange("storeId", value)}
                >
                  <SelectTrigger
                    className={validationErrors.storeId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.storeId && (
                  <p className="text-sm text-red-500">
                    {validationErrors.storeId}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Product
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
