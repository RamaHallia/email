import { supabase } from './supabase'

export interface CheckoutSessionRequest {
  priceId: string
  mode: 'subscription' | 'payment'
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface SubscriptionData {
  customer_id: string | null
  subscription_id: string | null
  subscription_status: string | null
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean | null
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export const createCheckoutSession = async (request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.access_token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      price_id: request.priceId,
      mode: request.mode,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl
    })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create checkout session')
  }

  return response.json()
}

export const getUserSubscription = async (): Promise<SubscriptionData | null> => {
  const { data, error } = await supabase
    .from('stripe_user_subscriptions')
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}