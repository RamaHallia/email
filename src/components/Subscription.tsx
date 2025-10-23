import { useState, useEffect } from 'react';
import { CreditCard, Users, Check, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionData {
  status: string;
  price_id: string | null;
  current_period_end: number | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  cancel_at_period_end: boolean;
}

export function Subscription() {
  const [additionalUsers, setAdditionalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCanceledMessage, setShowCanceledMessage] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const basePlanPrice = 29;
  const userPrice = 19;
  const totalPrice = basePlanPrice + (additionalUsers * userPrice);

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setShowSuccessMessage(true);
      window.history.replaceState({}, '', '/subscription');

      const pollInterval = setInterval(() => {
        fetchSubscription();
      }, 2000);

      setTimeout(() => {
        setShowSuccessMessage(false);
        clearInterval(pollInterval);
      }, 15000);

      return () => clearInterval(pollInterval);
    }
    if (params.get('canceled') === 'true') {
      setShowCanceledMessage(true);
      window.history.replaceState({}, '', '/subscription');
      setTimeout(() => setShowCanceledMessage(false), 5000);
    }
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (customerData?.customer_id) {
        const { data: subData } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('customer_id', customerData.customer_id)
          .is('deleted_at', null)
          .maybeSingle();

        if (subData) {
          setSubscription(subData);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const features = [
    { name: 'Tri automatique', description: 'Illimité' },
    { name: 'Réponses automatiques IA', description: 'Génération de brouillons' },
    { name: 'Comptes illimités', description: 'Gmail, Outlook, SMTP/IMAP' },
    { name: 'Support prioritaire', description: 'Assistance technique dédiée' }
  ];

  const handleUpdateSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Vous devez être connecté');
        return;
      }

      const basePlanPriceId = import.meta.env.VITE_STRIPE_BASE_PLAN_PRICE_ID;
      const additionalAccountPriceId = import.meta.env.VITE_STRIPE_ADDITIONAL_ACCOUNT_PRICE_ID;

      if (!basePlanPriceId || !additionalAccountPriceId) {
        alert('Configuration Stripe manquante');
        return;
      }

      const successUrl = `${window.location.origin}/subscription?success=true`;
      const cancelUrl = `${window.location.origin}/subscription?canceled=true`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: basePlanPriceId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            mode: 'subscription',
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        alert(`Erreur: ${data.error}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erreur lors de la création du checkout:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Il restera actif jusqu\'à la fin de la période de facturation en cours.')) {
      return;
    }

    setIsCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Vous devez être connecté');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.error) {
        alert(`Erreur: ${data.error}`);
        return;
      }

      if (data.success) {
        alert('Votre abonnement sera annulé à la fin de la période de facturation en cours.');
        await fetchSubscription();
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsCanceling(false);
    }
  };

  const subscriptionStatus = subscription?.status || 'not_started';
  const isActive = ['active', 'trialing'].includes(subscriptionStatus);
  const nextBillingTimestamp = subscription?.current_period_end;
  const actualNextBillingDate = nextBillingTimestamp
    ? new Date(nextBillingTimestamp * 1000)
    : nextBillingDate;
  const actualFormattedDate = actualNextBillingDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getStatusBadge = () => {
    if (subscription?.cancel_at_period_end && isActive) {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
          Annulation programmée
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          Actif
        </span>
      );
    }
    if (subscriptionStatus === 'past_due') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
          Paiement en retard
        </span>
      );
    }
    if (subscriptionStatus === 'canceled') {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
          Annulé
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
        Inactif
      </span>
    );
  };

  return (
    <div className="mt-6 space-y-6">
      {showSuccessMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-900">Paiement réussi !</p>
            <p className="text-sm text-green-700">Votre abonnement a été activé avec succès.</p>
          </div>
        </div>
      )}
      {showCanceledMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-900">Paiement annulé</p>
            <p className="text-sm text-yellow-700">Vous avez annulé le processus de paiement.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Votre abonnement</h3>

        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${isActive ? 'bg-green-50 border-green-200' : 'border-[#EF6855] bg-gradient-to-br from-orange-50 to-red-50'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isActive ? 'bg-green-200' : 'bg-gradient-to-br from-[#EF6855] to-[#F9A459]'}`}>
              <Star className={`w-6 h-6 ${isActive ? 'text-green-700' : 'text-white'}`} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#3D2817]">Plan Premier</h4>
              <p className="text-sm text-gray-600">{basePlanPrice}€ / mois</p>
              {isActive && (
                <div className="mt-1 space-y-1">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-gray-600">{feature.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {isActive ? (
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCanceling ? 'Annulation...' : 'Annuler'}
              </button>
            ) : (
              <button
                onClick={handleUpdateSubscription}
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Chargement...' : 'S\'abonner'}
              </button>
            )}
          </div>
        </div>

        {!isActive && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h5 className="text-sm font-semibold text-[#3D2817] mb-3">Inclus dans le plan :</h5>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{feature.name}</div>
                    <div className="text-xs text-gray-500">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Comptes email additionnels</h3>

        {!isActive && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Abonnement requis :</strong> Vous devez d'abord souscrire au Plan Premier à 29€/mois pour pouvoir ajouter des comptes additionnels.
            </p>
          </div>
        )}

        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${additionalUsers > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${additionalUsers > 0 ? 'bg-green-200' : 'bg-gray-200'}`}>
              <Users className={`w-6 h-6 ${additionalUsers > 0 ? 'text-green-700' : 'text-gray-500'}`} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#3D2817]">Comptes additionnels</h4>
              <p className="text-sm text-gray-600">19€ / compte / mois</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {additionalUsers > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                {additionalUsers} compte{additionalUsers > 1 ? 's' : ''}
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdditionalUsers(Math.max(0, additionalUsers - 1))}
                disabled={!isActive}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 text-gray-600 font-bold hover:border-[#EF6855] hover:text-[#EF6855] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
              >
                -
              </button>
              <span className="text-lg font-bold text-[#3D2817] min-w-[3ch] text-center">
                {additionalUsers}
              </span>
              <button
                onClick={() => setAdditionalUsers(additionalUsers + 1)}
                disabled={!isActive}
                className="w-8 h-8 rounded-lg border-2 border-[#EF6855] text-[#EF6855] font-bold hover:bg-[#EF6855] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#EF6855]"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-[#3D2817] mb-6">Résumé de facturation</h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-gray-700">
              <span>Plan Premier</span>
              <span className="font-medium">{basePlanPrice}€</span>
            </div>
            {additionalUsers > 0 && (
              <div className="flex items-center justify-between text-gray-700">
                <span>{additionalUsers} compte{additionalUsers > 1 ? 's' : ''} additionnel{additionalUsers > 1 ? 's' : ''}</span>
                <span className="font-medium">{additionalUsers * userPrice}€</span>
              </div>
            )}
            <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between">
              <span className="text-lg font-bold text-[#3D2817]">Total mensuel</span>
              <span className="text-3xl font-bold text-[#EF6855]">{totalPrice}€</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-6">
            {subscription?.cancel_at_period_end && isActive
              ? `Votre abonnement sera annulé le ${actualFormattedDate}`
              : isActive
              ? `Prochain paiement le ${actualFormattedDate}`
              : 'Aucun abonnement actif'}
          </div>

          {additionalUsers > 0 && (
            <button
              onClick={handleUpdateSubscription}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Chargement...' : 'Mettre à jour l\'abonnement'}
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Méthode de paiement</h3>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            {subscription?.payment_method_brand && subscription?.payment_method_last4 ? (
              <>
                <div className="font-medium text-gray-900">
                  {subscription.payment_method_brand.charAt(0).toUpperCase() + subscription.payment_method_brand.slice(1)} •••• {subscription.payment_method_last4}
                </div>
                <div className="text-sm text-gray-600">Méthode de paiement active</div>
              </>
            ) : (
              <>
                <div className="font-medium text-gray-900">Aucune carte enregistrée</div>
                <div className="text-sm text-gray-600">Ajoutez une méthode de paiement</div>
              </>
            )}
          </div>
          <button className="px-4 py-2 text-[#EF6855] font-medium hover:bg-orange-50 rounded-lg transition-colors">
            Modifier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#3D2817]">Historique de facturation</h3>
          <button className="text-sm text-[#EF6855] font-medium hover:underline">
            Voir tout
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">23 octobre 2025</div>
              <div className="text-sm text-gray-600">Plan Premier</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">29€</div>
              <span className="text-xs text-green-600 font-medium">Payé</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">23 septembre 2025</div>
              <div className="text-sm text-gray-600">Plan Premier</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">29€</div>
              <span className="text-xs text-green-600 font-medium">Payé</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">23 août 2025</div>
              <div className="text-sm text-gray-600">Plan Premier</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">29€</div>
              <span className="text-xs text-green-600 font-medium">Payé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
