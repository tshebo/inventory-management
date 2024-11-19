"use client"; // Indicates this is a client-side component. ST10062618

import StoreForm from "@/components/StoreForm"; // Store form component. ST10062618
import React from "react"; // React library import. ST10062618
import { useAuth } from "@/hooks/auth"; // Custom authentication hook. ST10062618
import { useRouter } from "next/navigation"; // Next.js router for navigation. ST10062618
import Spinner from "@/components/Spinner"; // Spinner component for loading state. ST10062618

function page() {
  const { user, role, loading } = useAuth(); // Authentication state and role. ST10062618
  const router = useRouter(); // Next.js router instance. ST10062618

  if (loading) {
    // Show spinner while loading. ST10062618
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (!user) {
    // Redirect to sign-in if user is not authenticated. ST10062618
    router.push("/sign-in");
  }

  if (role !== "admin") {
    // Redirect to unauthorized page if role is not admin. ST10062618
    router.push("/unauthorized");
  }

  return (
    <div>
      <StoreForm /> {/* Render the store form. ST10062618 */}
    </div>
  );
}

export default page;
