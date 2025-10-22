import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { getProductByPriceId } from '../../stripe-config'

interface SubscriptionData {
  subscription_status: string
  price_id: string | null
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status, price_id')
          .maybeSingle()

        if (error) {
          console.error('Error fetching subscription:', error)
        } else {
          setSubscription(data)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800">Aucun abonnement actif</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Choisissez un plan pour commencer à utiliser nos services.
        </p>
      </div>
    )
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null
  const statusText = subscription.subscription_status === 'active' ? 'Actif' : 
                    subscription.subscription_status === 'past_due' ? 'En retard' :
                    subscription.subscription_status === 'canceled' ? 'Annulé' :
                    subscription.subscription_status

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-900">Abonnement actuel</h3>
      <div className="mt-2">
        <p className="text-lg font-semibold text-gray-900">
          {product ? product.name : 'Plan inconnu'}
        </p>
        <p className="text-sm text-gray-600">
          Statut: <span className={`font-medium ${
            subscription.subscription_status === 'active' ? 'text-green-600' :
            subscription.subscription_status === 'past_due' ? 'text-yellow-600' :
            'text-red-600'
          }`}>{statusText}</span>
        </p>
      </div>
    </div>
  )
}