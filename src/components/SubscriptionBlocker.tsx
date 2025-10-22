import { ReactNode } from 'react';
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

  return (
    <>
      {children}
      {!hasActiveSubscription && (
        <SubscriptionModal
          isOpen={true}
          onClose={() => {}}
          emailAccountsCount={Math.max(emailAccountsCount, 1)}
          isUpgrade={false}
        />
      )}
    </>
  );
}
