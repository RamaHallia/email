import React, { useState } from 'react'
import { createCheckoutSession } from '../../lib/stripe'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import type { StripeProduct } from '../../stripe-config'

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
      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/pricing`
      })

      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      {error && (
        <Alert type="error" onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {product.name}
        </h3>
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {product.price}€
          {product.mode === 'subscription' && (
            <span className="text-sm font-normal text-gray-500">/mois</span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        {product.description}
      </p>

      <Button
        onClick={handleSubscribe}
        loading={loading}
        className="w-full"
      >
        {product.mode === 'subscription' ? 'S\'abonner' : 'Acheter'}
      </Button>
    </div>
  )
}