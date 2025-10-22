import React from 'react'
import { StripeProduct } from '../../stripe-config'
import { Button } from '../ui/Button'

interface SubscriptionCardProps {
  product: StripeProduct
  onSubscribe: (priceId: string) => void
  loading?: boolean
  isCurrentPlan?: boolean
}

export function SubscriptionCard({ product, onSubscribe, loading, isCurrentPlan }: SubscriptionCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
      {isCurrentPlan && (
        <div className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
          Plan actuel
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
      
      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          {product.price}€
        </span>
        <span className="text-gray-600 ml-1">
          /{product.mode === 'subscription' ? 'mois' : 'unique'}
        </span>
      </div>
      
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        {product.description}
      </p>
      
      <Button
        onClick={() => onSubscribe(product.priceId)}
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