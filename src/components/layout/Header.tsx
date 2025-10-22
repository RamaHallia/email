import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useSubscription } from '../../hooks/useSubscription'
import { Button } from '../ui/Button'
import { Mail } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { getSubscriptionPlan, isActive } = useSubscription()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Hall IA Email
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {isActive() && getSubscriptionPlan() && (
                  <span className="text-sm text-green-600 font-medium">
                    Plan: {getSubscriptionPlan()}
                  </span>
                )}
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}