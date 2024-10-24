import React, { useState, useEffect, ChangeEvent } from 'react';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon } from 'lucide-react';

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

interface Vendor {
  uid: string;
  displayName: string;
}

interface EditStoreModalProps {
  store: StoreData;
  isOpen: boolean;
  onClose: () => void;
  onStoreUpdate: (updatedStore: StoreData) => void;
}

interface FormData {
  name: string;
  description: string;
  imageUrl: string;
  vendorIds: string[];
}

// Define the fetchVendors function within the component file
const fetchVendors = async (): Promise<Vendor[]> => {
  const vendorsQuery = query(
    collection(db, "users"),
    where("role", "==", "vendor")
  );

  try {
    const querySnapshot = await getDocs(vendorsQuery);
    const vendors = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.name || data.displayName || "Unknown Name",
      };
    });
    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
};

const EditStoreModal = ({ store, isOpen, onClose, onStoreUpdate }: EditStoreModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: store.name,
    description: store.description,
    imageUrl: store.imageUrl,
    vendorIds: store.vendorIds,
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(store.imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const fetchedVendors = await fetchVendors();
        setVendors(fetchedVendors);
      } catch (error) {
        console.error('Error loading vendors:', error);
        setError('Failed to load vendors');
      }
    };
    loadVendors();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVendorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedVendors = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      vendorIds: selectedVendors,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, PNG, or WEBP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setError(null);
    }
  };

  const deleteOldImage = async (imageUrl: string) => {
    try {
      // Extract the path from the image URL
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Continue with the update even if deletion fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let newImageUrl = formData.imageUrl;

      // If a new image is selected, upload it and delete the old one
      if (imageFile) {
        // Upload new image
        const imageRef = ref(storage, `storeImages/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        newImageUrl = await getDownloadURL(imageRef);

        // Delete old image
        if (store.imageUrl) {
          await deleteOldImage(store.imageUrl);
        }
      }

      const storeRef = doc(db, 'stores', store.id);
      const updateData = {
        name: formData.name,
        description: formData.description,
        imageUrl: newImageUrl,
        vendorIds: formData.vendorIds,
      };

      await updateDoc(storeRef, updateData);

      const updatedStore: StoreData = {
        ...store,
        ...updateData,
      };
      
      onStoreUpdate(updatedStore);
      onClose();
    } catch (err) {
      console.error('Error updating store:', err);
      setError('Failed to update store details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>
              Make changes to your store details here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Store Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full min-h-[100px]"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendors">Assign Vendors (1-5 vendors required)</Label>
              <select
                id="vendors"
                name="vendors"
                multiple
                onChange={handleVendorChange}
                value={formData.vendorIds}
                className="w-full border rounded-lg p-2 min-h-[100px]"
              >
                {vendors.map((vendor) => (
                  <option key={vendor.uid} value={vendor.uid}>
                    {vendor.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Store Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Store preview"
                    className="max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
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
};

export default EditStoreModal;