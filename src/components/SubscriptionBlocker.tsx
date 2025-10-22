import { ReactNode } from 'react';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';

interface SubscriptionBlockerProps {
  hasActiveSubscription: boolean;
  loading: boolean;
  emailAccountsCount: number;
  children: ReactNode;
}

export function SubscriptionBlocker({
  hasActiveSubscription,
  loading,
  emailAccountsCount,
  children,
}: SubscriptionBlockerProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EF6855] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#EF6855]" />
            </div>
            <h2 className="text-3xl font-bold text-[#3D2817] mb-3">
              Abonnement requis
            </h2>
            <p className="text-gray-600 text-lg">
              Pour accéder à Hall IA et profiter de toutes les fonctionnalités,
              vous devez souscrire à un abonnement.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border-2 border-[#EF6855] mb-8">
            <h3 className="font-bold text-[#3D2817] mb-4 text-lg">
              Ce qui vous attend avec Hall IA :
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  <strong>Classification intelligente</strong> - Triez automatiquement vos emails dans Info, Traités et Pub
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  <strong>Réponses automatiques</strong> - Générez des brouillons de réponse personnalisés avec l'IA
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  <strong>Gain de temps</strong> - Économisez jusqu'à 3 heures par jour sur la gestion de vos emails
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700">
                  <strong>Statistiques détaillées</strong> - Suivez votre productivité et le temps économisé
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">Tarif simple et transparent</div>
                <div>
                  Seulement 29€/mois pour 1 compte email. Ajoutez des comptes supplémentaires pour 19€/compte/mois.
                  Annulable à tout moment.
                </div>
              </div>
            </div>
          </div>

          <SubscriptionModal
            isOpen={true}
            emailAccountsCount={Math.max(emailAccountsCount, 1)}
            isUpgrade={false}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
