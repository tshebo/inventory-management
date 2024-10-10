"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AlertCircle, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db, auth, storage } from "@/lib/firebase"; // Adjust this import path as needed
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
interface Vendor {
  uid: string;
  displayName: string;
}

interface FormData {
  name: string;
  description: string;
  vendors: string[]; // Storing vendor IDs
}

interface ValidationErrors {
  name: string;
  description: string;
  image: string;
  vendors: string;
}

async function fetchVendors() {
  console.log("Fetching vendors...");
  const vendorsQuery = query(
    collection(db, "users"),
    where("role", "==", "vendor")
  );

  try {
    const querySnapshot = await getDocs(vendorsQuery);
    console.log("Query snapshot size:", querySnapshot.size);

    // Log each document for debugging
    querySnapshot.forEach((doc) => {
      console.log("Vendor document:", {
        id: doc.id,
        data: doc.data(),
      });
    });

    const vendors = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.name || data.displayName || "Unknown Name", // Fallback if name is undefined
      };
    });

    console.log("Processed vendors:", vendors);
    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export default function StoreForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    vendors: [], // Initialize as an empty array
  });
  const [vendors, setVendors] = useState<Vendor[]>([]); // Store the list of vendors
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    name: "",
    description: "",
    image: "",
    vendors: "",
  });

  useEffect(() => {
    async function loadVendors() {
      try {
        setIsLoading(true);
        const fetchedVendors = await fetchVendors();
        console.log("Fetched vendors in component:", fetchedVendors);
        setVendors(fetchedVendors);
      } catch (error) {
        console.error("Error in loadVendors:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadVendors();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    const newValidationErrors: ValidationErrors = {
      name: "",
      description: "",
      image: "",
      vendors: "",
    };

    // Name validation
    if (!formData.name.trim()) {
      newValidationErrors.name = "Store name is required";
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newValidationErrors.name = "Store name must be at least 3 characters";
      isValid = false;
    } else if (formData.name.trim().length > 50) {
      newValidationErrors.name = "Store name must be less than 50 characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      newValidationErrors.description = "Description is required";
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newValidationErrors.description =
        "Description must be at least 10 characters";
      isValid = false;
    } else if (formData.description.trim().length > 500) {
      newValidationErrors.description =
        "Description must be less than 500 characters";
      isValid = false;
    }

    // Vendors validation - fixing the syntax error here
    if (formData.vendors.length < 1 || formData.vendors.length > 5) {
      newValidationErrors.vendors =
        "You must select between 1 to 5 vendors for this store";
      isValid = false;
    }

    // Image validation
    if (!imageFile) {
      newValidationErrors.image = "Store image is required";
      isValid = false;
    }

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleVendorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedVendors = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      vendors: selectedVendors,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setValidationErrors((prev) => ({
          ...prev,
          image: "Please upload a valid image file (JPG, PNG, or WEBP)",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          image: "Image must be less than 5MB",
        }));
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setValidationErrors((prev) => ({
        ...prev,
        image: "",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      setError("Please correct the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to create a store");
      }
      if (!imageFile) {
        throw new Error("Image file is required");
      }
      // Create a reference to the storage location
      const imageRef = ref(storage, `storeImages/${imageFile.name}`);

      // Upload the image file to Firebase Storage
      await uploadBytes(imageRef, imageFile);

      // Get the download URL for the uploaded image
      const imageUrl = await getDownloadURL(imageRef);

      const storeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        vendorIds: formData.vendors, // Array of selected vendor IDs
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        imageUrl, // Include the image URL in the store data
      };

      await addDoc(collection(db, "stores"), storeData);
      setSuccess(true);
      toast.success(`Store Created`);
      // Reset form
      setFormData({
        name: "",
        description: "",
        vendors: [],
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the store");
      toast.error(`Error ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Store</CardTitle>
          <CardDescription>
            Create a new store and assign vendors to it.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter store name"
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
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter store description"
                rows={4}
                className={validationErrors.description ? "border-red-500" : ""}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500">
                  {validationErrors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendors">Assign Vendors *</Label>
              <select
                id="vendors"
                name="vendors"
                multiple
                onChange={handleVendorChange}
                value={formData.vendors}
                className="w-full border rounded-lg"
              >
                {vendors.map((vendor) => (
                  <option key={vendor.uid} value={vendor.uid}>
                    {vendor.displayName}
                  </option>
                ))}
              </select>
              {validationErrors.vendors && (
                <p className="text-sm text-red-500">
                  {validationErrors.vendors}
                </p>
              )}{" "}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Store Image *</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Image preview"
                  className="mt-2 max-h-64"
                />
              )}
              {validationErrors.image && (
                <p className="text-sm text-red-500">{validationErrors.image}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Create Store
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mt-4">
          <AlertTitle ><Check className="bg-green-600 mr-4 "/>Success</AlertTitle>
          <AlertDescription>Store created successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
