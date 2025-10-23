import { useState } from 'react';
import { CreditCard, Users, Check } from 'lucide-react';

export function Subscription() {
  const [additionalUsers, setAdditionalUsers] = useState(0);

  const basePlanPrice = 29;
  const userPrice = 19;
  const totalPrice = basePlanPrice + (additionalUsers * userPrice);

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const formattedDate = nextBillingDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="mt-6 space-y-6">
      {/* Plan actuel */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#3D2817]">Plan actuel</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Actif
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-[#EF6855]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-[#3D2817] text-lg">Plan Premier</div>
              <div className="text-sm text-gray-600">1 utilisateur inclus</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#3D2817]">29€</div>
            <div className="text-xs text-gray-500">par mois</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Tri automatique des emails</div>
              <div className="text-sm text-gray-600">Classification intelligente Info / Traités / Pub</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Réponses automatiques IA</div>
              <div className="text-sm text-gray-600">Génération de brouillons intelligents</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Comptes illimités</div>
              <div className="text-sm text-gray-600">Gmail, Outlook, SMTP/IMAP</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Support prioritaire</div>
              <div className="text-sm text-gray-600">Assistance technique dédiée</div>
            </div>
          </div>
        </div>
      </div>

      {/* Utilisateurs additionnels */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#3D2817]">Utilisateurs additionnels</h3>
          <span className="text-sm text-gray-600">19€ / utilisateur / mois</span>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Nombre d'utilisateurs</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdditionalUsers(Math.max(0, additionalUsers - 1))}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 text-gray-600 font-bold hover:border-[#EF6855] hover:text-[#EF6855] transition-colors"
              >
                -
              </button>
              <span className="text-lg font-bold text-[#3D2817] min-w-[3ch] text-center">
                {additionalUsers}
              </span>
              <button
                onClick={() => setAdditionalUsers(additionalUsers + 1)}
                className="w-8 h-8 rounded-lg border-2 border-[#EF6855] text-[#EF6855] font-bold hover:bg-[#EF6855] hover:text-white transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
            <span className="text-gray-600">Coût des utilisateurs additionnels</span>
            <span className="font-semibold text-gray-900">{additionalUsers * userPrice}€</span>
          </div>
        </div>
      </div>

      {/* Résumé et facturation */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Résumé de facturation</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-gray-700">
            <span>Plan Premier</span>
            <span className="font-medium">{basePlanPrice}€</span>
          </div>
          {additionalUsers > 0 && (
            <div className="flex items-center justify-between text-gray-700">
              <span>{additionalUsers} utilisateur{additionalUsers > 1 ? 's' : ''} additionnel{additionalUsers > 1 ? 's' : ''}</span>
              <span className="font-medium">{additionalUsers * userPrice}€</span>
            </div>
          )}
          <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between">
            <span className="text-lg font-bold text-[#3D2817]">Total mensuel</span>
            <span className="text-3xl font-bold text-[#EF6855]">{totalPrice}€</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 mb-6">
          Prochain paiement le {formattedDate}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 px-4 py-3 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-lg font-medium hover:shadow-lg transition-all">
            Mettre à jour l'abonnement
          </button>
          <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </div>
      </div>

      {/* Méthode de paiement */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Méthode de paiement</h3>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Visa •••• 4242</div>
            <div className="text-sm text-gray-600">Expire 12/2027</div>
          </div>
          <button className="px-4 py-2 text-[#EF6855] font-medium hover:bg-orange-50 rounded-lg transition-colors">
            Modifier
          </button>
        </div>
      </div>

      {/* Historique de facturation */}
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
