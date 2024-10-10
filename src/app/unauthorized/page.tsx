'use client'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, LogIn } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from 'next/navigation'
export default function UnauthorizedPage() {

  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="mt-3 text-center text-2xl font-extrabold text-gray-900">
            Unauthorized Access
          </CardTitle>
          <CardDescription className="mt-2 text-center text-sm text-gray-600">
            Sorry, you don&apos;t have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-500">
            If you believe this is an error, please contact the administrator or try logging in with a different account.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            className="w-full sm:w-1/2"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant="default"
            className="w-full sm:w-1/2"
            asChild
          >
            <Link href="/sign-in">
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}