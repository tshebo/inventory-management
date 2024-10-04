'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WaitingRoom from '@/components/waiting-room'
import { useAuth } from '@/hooks/auth'
import { Loader2 } from "lucide-react"

export default function WaitingRoomPage() {
  const { loading, role, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/sign-in')
      } else if (role && role !== 'user') {
        // If role is already assigned, redirect to appropriate page
        const redirectMap: { [key: string]: string } = {
          admin: '/admin',
          vendor: '/dashboard',
          // Add other roles as needed
        }
        const redirectPath = redirectMap[role] || '/dashboard'
        router.replace(redirectPath)
      }
    }
  }, [loading, role, user, router])

  // Show loading state while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If no user, the useEffect will handle redirect
  if (!user) {
    return null
  }

  // If user exists but role isn't 'user', useEffect will handle redirect
  if (role && role !== 'user') {
    return null
  }

  // Only show waiting room if user exists and role is 'user'
  return <WaitingRoom />
}