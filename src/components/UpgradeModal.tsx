import { useState } from 'react';
import { X, Star, Users, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  currentAdditionalAccounts?: number;
}

export function UpgradeModal({ onClose, onUpgrade, currentAdditionalAccounts = 0 }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const newAdditionalAccounts = currentAdditionalAccounts + 1;
  const newTotal = 29 + (newAdditionalAccounts * 19);

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Vous devez être connecté');
        return;
      }

      const { data: customerData } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!customerData) {
        alert('Aucun client Stripe trouvé');
        return;
      }

      const newAccounts = newAdditionalAccounts;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-update-subscription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            additional_accounts: newAccounts,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        alert(`Erreur: ${data.error}`);
        return;
      }

      if (data.success) {
        alert('Votre abonnement a été mis à jour avec succès ! Vous pouvez maintenant ajouter un compte supplémentaire.');
        onUpgrade();
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#3D2817]">Upgrade requis</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#EF6855] to-[#F9A459] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#3D2817]">Compte additionnel</h3>
                <p className="text-sm text-gray-600">+19€ / mois</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Vous avez atteint la limite de votre plan actuel. Pour ajouter un deuxième compte email,
              vous devez upgrader votre abonnement.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-[#3D2817] mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#EF6855]" />
                Ce qui est inclus :
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Un compte email supplémentaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Tri automatique illimité</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Réponses automatiques IA</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Nouveau total mensuel</p>
                  <p className="text-xs text-gray-600">
                    Plan Premier (29€) + {newAdditionalAccounts} compte{newAdditionalAccounts > 1 ? 's' : ''} additionnel{newAdditionalAccounts > 1 ? 's' : ''} ({newAdditionalAccounts * 19}€)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#EF6855]">{newTotal}€</p>
                  <p className="text-xs text-gray-600">/mois</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleUpgradeClick}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Chargement...' : 'Upgrader maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
