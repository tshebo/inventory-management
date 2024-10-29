"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Changed from 'next/router'
import LoginPage from "@/components/Login";
import { useAuth } from "@/hooks/auth";
import Spinner from "@/components/Spinner";
import { Loader2 } from "lucide-react";
export default function LoginPageWrapper() {
  // Renamed for clarity and convention
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (!loading && user ) {
  //     router.push("/dashboard");
  //   }
  // }, [user, loading, router]);

  if (role === "admin") {
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-xl font-medium text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  } else if (role === "vendor") {
    router.push("/dashboard");
  } else if (role === "customer") {
    router.push("/waiting-room");
  }

  return <LoginPage />;
}
