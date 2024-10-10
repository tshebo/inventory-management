"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/auth";

const TIMEOUT_DURATION = 60000; // 1 minute timeout
const MIN_WAIT_TIME = 5000; // 5 seconds minimum wait
const MAX_ADDITIONAL_WAIT = 10000; // Up to 10 additional seconds

export default function WaitingRoom() {
  const [isAssigned, setIsAssigned] = useState(false);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const checkRoleAssignment = useCallback(async () => {
    try {
      if (role !== "customer") {
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Error checking role assignment:", error);
      return false;
    }
  }, []);

  if (!loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-destructive">
              Timeout Occurred
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              We're sorry, but the role assignment is taking longer than
              expected. Please try refreshing the page or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Waiting for Role Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <p className="mt-4 text-lg">
              Please wait while we set up your account...
            </p>
          </div>
          <p className="text-center text-muted-foreground">
            You will be automatically redirected once your role is assigned.
            This process usually takes a few moments.
          </p>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          If you are not redirected within a minute, please refresh the page or
          contact support.
        </p>
        <p className="mt-2">© 2024 Your Company Name. All rights reserved.</p>
      </footer>
    </div>
  );
}
