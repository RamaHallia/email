import React, { useState, useEffect } from 'react'
import { stripeProducts } from '../../stripe-config'
import { SubscriptionCard } from './SubscriptionCard'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { Alert } from '../ui/Alert'

export function SubscriptionPlans() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPriceId, setCurrentPriceId] = useState<string | null>(null)
  const { session } = useAuth()

  useEffect(() => {
    if (session) {
      fetchCurrentSubscription()
    }
  }, [session])

  const fetchCurrentSubscription = async () => {
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
        setCurrentPriceId(data.price_id)
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!session) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
          mode: 'subscription'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la création de la session de paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-lg text-gray-600">
          Sélectionnez le plan qui correspond le mieux à vos besoins
        </p>
      </div>

      {error && (
        <div className="mb-8">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {stripeProducts.map((product) => (
          <SubscriptionCard
            key={product.priceId}
            product={product}
            onSubscribe={handleSubscribe}
            loading={loading}
            isCurrentPlan={currentPriceId === product.priceId}
          />
        ))}
      </div>
    </div>
  )
}