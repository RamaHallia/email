import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Non authentifié')
    }

    const { emailAccountsCount = 1, isUpgrade = false } = await req.json()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const basePrice = 2900
    const additionalUserPrice = 1900

    let customer
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingSubscription?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingSubscription.stripe_customer_id)
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
    }

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Hall IA - Plan de base',
            description: '1 compte email inclus',
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: basePrice,
        },
        quantity: 1,
      },
    ]

    if (emailAccountsCount > 1) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Hall IA - Comptes additionnels',
            description: 'Compte email supplémentaire',
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: additionalUserPrice,
        },
        quantity: emailAccountsCount - 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        email_accounts_count: emailAccountsCount.toString(),
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
