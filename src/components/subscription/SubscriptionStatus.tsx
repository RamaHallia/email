import React, { useState, useEffect } from 'react'
import { getUserSubscription, type SubscriptionData } from '../../lib/stripe'
import { getProductByPriceId } from '../../stripe-config'
import { Alert } from '../ui/Alert'

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await getUserSubscription()
        setSubscription(data)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subscription')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert type="error">
        {error}
      </Alert>
    )
  }

  if (!subscription || !subscription.price_id) {
    return (
      <div className="text-sm text-gray-600">
        No active subscription
      </div>
    )
  }

  const product = getProductByPriceId(subscription.price_id)
  const statusColors = {
    active: 'text-green-600 bg-green-100',
    trialing: 'text-blue-600 bg-blue-100',
    past_due: 'text-yellow-600 bg-yellow-100',
    canceled: 'text-red-600 bg-red-100',
    unpaid: 'text-red-600 bg-red-100',
    incomplete: 'text-gray-600 bg-gray-100',
    incomplete_expired: 'text-gray-600 bg-gray-100',
    paused: 'text-gray-600 bg-gray-100',
    not_started: 'text-gray-600 bg-gray-100'
  }

  const statusColor = statusColors[subscription.subscription_status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {product?.name || 'Unknown Plan'}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
          {subscription.subscription_status?.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      {subscription.current_period_end && (
        <div className="text-xs text-gray-500">
          {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
          {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}