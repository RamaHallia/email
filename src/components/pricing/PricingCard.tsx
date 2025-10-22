import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { StripeProduct } from '../../stripe-config'
import { supabase } from '../../lib/supabase'

interface PricingCardProps {
  product: StripeProduct
}

export function PricingCard({ product }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please sign in to subscribe')
        setLoading(false)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {product.name}
        </h3>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            {product.price}€
          </span>
          {product.mode === 'subscription' && (
            <span className="text-gray-600 ml-2">/mois</span>
          )}
        </div>

        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          {product.description}
        </p>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Button
          onClick={handleSubscribe}
          loading={loading}
          className="w-full"
          size="lg"
        >
          {product.mode === 'subscription' ? 'S\'abonner' : 'Acheter'}
        </Button>
      </div>
    </div>
  )
}