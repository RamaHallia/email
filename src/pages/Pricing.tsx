import React from 'react'
import { PricingCard } from '../components/pricing/PricingCard'
import { STRIPE_PRODUCTS } from '../stripe-config'

export function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choisissez votre plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Sélectionnez le plan qui correspond le mieux à vos besoins
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {STRIPE_PRODUCTS.map((product) => (
            <PricingCard key={product.priceId} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}