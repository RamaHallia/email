import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { StripeProduct } from '../../stripe-config';
import { createCheckoutSession } from '../../lib/stripe';

interface PricingCardProps {
  product: StripeProduct;
  isPopular?: boolean;
}

export function PricingCard({ product, isPopular = false }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg border-2 ${
      isPopular ? 'border-blue-500' : 'border-gray-200'
    } p-8`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            Populaire
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {product.name}
        </h3>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            {product.currencySymbol}{product.price}
          </span>
          {product.mode === 'subscription' && (
            <span className="text-gray-600 ml-2">/mois</span>
          )}
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          {product.description}
        </p>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isPopular
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Chargement...
            </>
          ) : (
            product.mode === 'subscription' ? 'S\'abonner' : 'Acheter'
          )}
        </button>
      </div>
    </div>
  );
}