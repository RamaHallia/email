import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { StripeProduct } from '../../stripe-config'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

interface SubscriptionCardProps {
  product: StripeProduct
  isCurrentPlan?: boolean
}

export function SubscriptionCard({ product, isCurrentPlan = false }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { session } = useAuth()

  const handleSubscribe = async () => {
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
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Plan actuel
          </span>
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">{product.price}€</span>
          {product.mode === 'subscription' && (
            <span className="text-gray-600">/mois</span>
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-6">{product.description}</p>

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <Button
        onClick={handleSubscribe}
        loading={loading}
        disabled={isCurrentPlan}
        className="w-full"
        variant={isCurrentPlan ? 'outline' : 'primary'}
      >
        {isCurrentPlan ? 'Plan actuel' : 'Choisir ce plan'}
      </Button>
    </div>
  )
}