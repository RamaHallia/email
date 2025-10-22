import { useState } from 'react';
import { CreditCard, Check, X, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  emailAccountsCount: number;
  isUpgrade?: boolean;
}

export function SubscriptionModal({ isOpen, onClose, emailAccountsCount, isUpgrade = false }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const basePrice = 29;
  const additionalUserPrice = 19;
  const totalPrice = basePrice + (emailAccountsCount > 1 ? (emailAccountsCount - 1) * additionalUserPrice : 0);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailAccountsCount,
            isUpgrade,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] p-8 text-white relative">
          {onClose && !isUpgrade && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">
                {isUpgrade ? 'Mettre à niveau votre abonnement' : 'Activer votre abonnement'}
              </h2>
              <p className="text-white/90">
                {isUpgrade
                  ? `Ajoutez ${emailAccountsCount > 1 ? emailAccountsCount - 1 : 0} compte(s) email supplémentaire(s)`
                  : 'Commencez à automatiser vos emails dès maintenant'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isUpgrade && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold mb-1">Compte email configuré avec succès !</div>
                  <div>Pour commencer à utiliser Hall IA et profiter de toutes les fonctionnalités, vous devez activer votre abonnement.</div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border-2 border-[#EF6855] mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#3D2817] mb-1">
                  {emailAccountsCount === 1 ? 'Plan Premier' : `Plan ${emailAccountsCount} compte${emailAccountsCount > 1 ? 's' : ''}`}
                </h3>
                <p className="text-gray-600">
                  {emailAccountsCount === 1
                    ? '1 compte email inclus'
                    : `1 compte de base + ${emailAccountsCount - 1} additionnel${emailAccountsCount > 2 ? 's' : ''}`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-[#EF6855]">{totalPrice}€</div>
                <div className="text-gray-600">/mois</div>
              </div>
            </div>

            {emailAccountsCount > 1 && (
              <div className="mb-6 p-3 bg-white rounded-lg border border-orange-200">
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Plan de base (1 compte)</span>
                    <span className="font-medium">{basePrice}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comptes additionnels ({emailAccountsCount - 1} × {additionalUserPrice}€)</span>
                    <span className="font-medium">{(emailAccountsCount - 1) * additionalUserPrice}€</span>
                  </div>
                  <div className="pt-2 border-t border-orange-200 flex justify-between font-bold text-[#3D2817]">
                    <span>Total</span>
                    <span>{totalPrice}€/mois</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-[#3D2817] mb-3">Ce qui est inclus :</h4>
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Classification intelligente des emails</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Génération automatique de réponses personnalisées</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Filtrage automatique des publicités</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Statistiques et rapports détaillés</span>
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
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {isUpgrade ? 'Mettre à niveau maintenant' : 'Souscrire maintenant'}
                </>
              )}
            </button>
            {onClose && !isUpgrade && (
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Plus tard
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Paiement sécurisé par Stripe • Annulable à tout moment
          </p>
        </div>
      </div>
    </div>
  );
}
