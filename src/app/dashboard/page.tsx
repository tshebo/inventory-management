'use client'
import { useAuth } from "@/hooks/auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  
    const { user, role, loading } = useAuth();
    const router = useRouter();
  
    useEffect(() => {
      if (!loading && !user ) {
        router.push("/sign-in");
      } 
    }, [user, loading, router]);
  
    if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-xl font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
      ) 
  }
  
  return <div>Dashboard</div>
}
