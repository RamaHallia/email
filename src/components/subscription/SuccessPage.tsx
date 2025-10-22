import React, { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { getProductByPriceId } from '../../stripe-config'

export function SuccessPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  useEffect(() => {
    if (session) {
      fetchSubscription()
    }
  }, [session])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
        return
      }

      setSubscription(data)
    } catch (err) {
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  const getProductName = () => {
    if (!subscription?.price_id) return 'Votre plan'
    const product = getProductByPriceId(subscription.price_id)
    return product?.name || 'Votre plan'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          
          <div className="mb-6">
            <Alert type="success">
              Votre abonnement à <strong>{getProductName()}</strong> a été activé avec succès.
            </Alert>
          </div>

          {subscription && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Détails de l'abonnement</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Plan :</span> {getProductName()}</p>
                <p><span className="font-medium">Statut :</span> {subscription.subscription_status}</p>
                {subscription.payment_method_brand && subscription.payment_method_last4 && (
                  <p>
                    <span className="font-medium">Méthode de paiement :</span>{' '}
                    {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Accéder au tableau de bord
            </Button>
            
            <Button
              onClick={() => window.location.href = '/pricing'}
              variant="outline"
              className="w-full"
            >
              Voir tous les plans
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}