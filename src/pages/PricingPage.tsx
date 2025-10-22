import React, { useEffect, useState } from 'react'
import { SubscriptionCard } from '../components/subscription/SubscriptionCard'
import { stripeProducts } from '../stripe-config'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export function PricingPage() {
  const [currentPriceId, setCurrentPriceId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchCurrentSubscription = async () => {
      try {
        const { data } = await supabase
          .from('stripe_user_subscriptions')
          .select('price_id, subscription_status')
          .maybeSingle()

        if (data && data.subscription_status === 'active') {
          setCurrentPriceId(data.price_id)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }

    fetchCurrentSubscription()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choisissez votre plan
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Sélectionnez le plan qui correspond le mieux à vos besoins
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {stripeProducts.map((product) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isCurrentPlan={currentPriceId === product.priceId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}