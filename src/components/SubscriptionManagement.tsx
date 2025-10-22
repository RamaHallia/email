import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CreditCard, Check, AlertCircle, Loader, ExternalLink, Calendar, Users } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';

interface Subscription {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan_type: string;
  email_accounts_count: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function SubscriptionManagement() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailAccountsCount, setEmailAccountsCount] = useState(0);
  const [managingBilling, setManagingBilling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
      loadEmailAccountsCount();
    }
  }, [user?.id]);

  const loadSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailAccountsCount = async () => {
    if (!user?.id) return;

    const { count } = await supabase
      .from('email_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_connected', true);

    setEmailAccountsCount(count || 0);
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) return;

    setManagingBilling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: subscription.stripe_customer_id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de la session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error:', err);
      alert('Erreur lors de l\'ouverture du portail de facturation');
      setManagingBilling(false);
    }
  };

  const totalPrice = 29;

  const statusConfig = {
    active: {
      label: 'Actif',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: Check,
    },
    past_due: {
      label: 'Paiement en retard',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: AlertCircle,
    },
    canceled: {
      label: 'Annulé',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: AlertCircle,
    },
    incomplete: {
      label: 'Incomplet',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: AlertCircle,
    },
  };

  const currentStatus = subscription?.status as keyof typeof statusConfig || 'incomplete';
  const StatusIcon = statusConfig[currentStatus]?.icon || AlertCircle;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-[#EF6855] animate-spin" />
      </div>
    );
  }

  if (!subscription || subscription.status === 'incomplete') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-[#EF6855]" />
          <div>
            <h2 className="text-2xl font-bold text-[#3D2817]">Abonnement</h2>
            <p className="text-gray-600 mt-1">Gérez votre abonnement et votre facturation</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-orange-200">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#EF6855]" />
            </div>
            <h3 className="text-xl font-bold text-[#3D2817] mb-2">
              Aucun abonnement actif
            </h3>
            <p className="text-gray-600 mb-6">
              Pour utiliser Hall IA, vous devez souscrire à un abonnement.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Souscrire maintenant
            </button>
          </div>
        </div>

        <SubscriptionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          emailAccountsCount={Math.max(emailAccountsCount, 1)}
          isUpgrade={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6 text-[#EF6855]" />
        <div>
          <h2 className="text-2xl font-bold text-[#3D2817]">Abonnement</h2>
          <p className="text-gray-600 mt-1">Gérez votre abonnement et votre facturation</p>
        </div>
      </div>

      {/* Statut de l'abonnement */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`${statusConfig[currentStatus]?.bgColor} rounded-lg p-2`}>
              <StatusIcon className={`w-6 h-6 ${statusConfig[currentStatus]?.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-[#3D2817]">Plan Hall IA</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[currentStatus]?.bgColor} ${statusConfig[currentStatus]?.color} ${statusConfig[currentStatus]?.borderColor} border`}>
                  {statusConfig[currentStatus]?.label}
                </span>
                {subscription.cancel_at_period_end && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                    Annulation prévue
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#EF6855]">{totalPrice}€</div>
            <div className="text-sm text-gray-600">/mois</div>
          </div>
        </div>

        {/* Détails du plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {subscription.current_period_end && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Prochaine facturation</span>
              </div>
              <div className="font-semibold text-[#3D2817]">
                {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Comptes email</span>
            </div>
            <div className="font-semibold text-[#3D2817]">
              {subscription.email_accounts_count} compte{subscription.email_accounts_count > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {subscription.cancel_at_period_end && subscription.current_period_end && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <div className="font-semibold mb-1">Votre abonnement sera annulé</div>
                <div>
                  Vous conserverez l'accès à Hall IA jusqu'au{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}. Après cette date, votre accès sera suspendu.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="flex-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {managingBilling ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Chargement...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Gérer mon abonnement
              </>
            )}
          </button>

          {emailAccountsCount > subscription.email_accounts_count && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 sm:flex-none px-6 py-3 border-2 border-[#EF6855] text-[#EF6855] rounded-lg font-medium hover:bg-orange-50 transition-colors"
            >
              Mettre à niveau
            </button>
          )}
        </div>
      </div>

      {/* Fonctionnalités incluses */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-bold text-[#3D2817] mb-4">Fonctionnalités incluses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Classification intelligente des emails</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Réponses automatiques personnalisées</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Filtrage des publicités</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Statistiques détaillées</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Support par email</span>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Annulation à tout moment</span>
          </div>
        </div>
      </div>

      {/* Info facturation */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <div className="font-semibold mb-1">À propos de votre abonnement</div>
            <div>
              Cliquez sur "Gérer mon abonnement" pour mettre à jour votre moyen de paiement,
              consulter vos factures ou annuler votre abonnement. Vous serez redirigé vers
              notre portail de facturation sécurisé.
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        emailAccountsCount={emailAccountsCount}
        isUpgrade={true}
      />
    </div>
  );
}
