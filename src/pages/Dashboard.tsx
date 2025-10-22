import React from 'react'
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'
import { Button } from '../components/ui/Button'

export function Dashboard() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Subscription Status
                </h3>
                <SubscriptionStatus />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}