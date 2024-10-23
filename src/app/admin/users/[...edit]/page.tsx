"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserFormData {
  email: string;
  name: string;
  role: "admin" | "vendor" | "user";
}

export default function EditUser({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    role: "user",
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!params.id) {
        setError("User ID is required");
        setIsFetching(false);
        return;
      }

      try {
        // Initialize Firebase auth first if needed
        // const auth = getAuth();
        // await new Promise((resolve) => {
        //   const unsubscribe = onAuthStateChanged(auth, (user) => {
        //     unsubscribe();
        //     resolve(user);
        //   });
        // });

        const userDocRef = doc(db, "users", params.id);
        const userDoc = await getDoc(userDocRef);
        
        if (!isMounted) return;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            email: userData.email || "",
            name: userData.name || "",
            role: userData.role || "user",
          });
        } else {
          setError("User not found");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching user:", error);
        setError("Error fetching user data. Please make sure you have the correct permissions.");
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.name) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) {
      toast.error("User ID is required");
      return;
    }

    if (validateForm()) {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, "users", params.id);
        await updateDoc(userDocRef, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          updatedAt: new Date().toISOString(),
        });
        
        toast.success("User updated successfully");
        router.push("/admin/users");
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Error updating user. Please check your permissions.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the error when user starts typing
    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserFormData["role"] }));
  };

  const handleCancel = () => {
    router.push("/admin/users");
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCancel} className="w-full">
              Return to Users List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
          <CardDescription>Update user account details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="flex items-center text-sm text-destructive">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="flex items-center text-sm text-destructive">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                onValueChange={handleRoleChange}
                value={formData.role}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}