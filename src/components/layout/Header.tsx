import React, { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getProductByPriceId } from '../../stripe-config'
import { Button } from '../ui/Button'
import { User, LogOut, CreditCard } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<string>('Aucun plan')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCurrentPlan()
    }
  }, [user])

  const fetchCurrentPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('price_id, subscription_status')
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
        return
      }

      if (data && data.subscription_status === 'active') {
        const product = getProductByPriceId(data.price_id)
        setCurrentPlan(product?.name || 'Plan actif')
      } else {
        setCurrentPlan('Aucun plan actif')
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Hall IA</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4" />
              <span>
                {loading ? 'Chargement...' : currentPlan}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.email}</span>
            </div>

            <Button
              onClick={() => window.location.href = '/pricing'}
              variant="outline"
              size="sm"
            >
              Plans
            </Button>

            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}