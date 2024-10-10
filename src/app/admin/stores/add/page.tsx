"use client";
import StoreForm from "@/components/StoreForm";
import React from "react";
import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
function Page() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }
  if (!user) {
    router.push("/sign-in");
  }
  if (role !== "admin") {
    router.push("/unauthorized");
  }

  return (
    <div>
      <StoreForm />
    </div>
  );
}

export default Page;
