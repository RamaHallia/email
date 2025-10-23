import { useState } from 'react';
import { CreditCard, Users, Check, Star, Zap, Crown } from 'lucide-react';

export function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'premier' | 'enterprise'>('premier');
  const [additionalUsers, setAdditionalUsers] = useState(0);

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 0,
      icon: Zap,
      gradient: 'from-gray-500 to-gray-600',
      borderColor: 'border-gray-300',
      bgGradient: 'from-gray-50 to-gray-100',
      popular: false,
      features: [
        { name: 'Tri automatique', available: true, description: '100 emails/mois' },
        { name: 'Réponses automatiques', available: false },
        { name: '1 compte email', available: true },
        { name: 'Support standard', available: true }
      ]
    },
    {
      id: 'premier' as const,
      name: 'Premier',
      price: 29,
      icon: Star,
      gradient: 'from-[#EF6855] to-[#F9A459]',
      borderColor: 'border-[#EF6855]',
      bgGradient: 'from-orange-50 to-red-50',
      popular: true,
      features: [
        { name: 'Tri automatique', available: true, description: 'Illimité' },
        { name: 'Réponses automatiques IA', available: true, description: 'Génération de brouillons' },
        { name: 'Comptes illimités', available: true, description: 'Gmail, Outlook, SMTP/IMAP' },
        { name: 'Support prioritaire', available: true, description: 'Assistance technique dédiée' }
      ]
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 99,
      icon: Crown,
      gradient: 'from-purple-500 to-purple-700',
      borderColor: 'border-purple-500',
      bgGradient: 'from-purple-50 to-purple-100',
      popular: false,
      features: [
        { name: 'Tout du plan Premier', available: true },
        { name: 'API accès complet', available: true, description: 'Intégration personnalisée' },
        { name: 'Utilisateurs illimités', available: true },
        { name: 'Support 24/7', available: true, description: 'Équipe dédiée' }
      ]
    }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const userPrice = 19;
  const totalPrice = currentPlan.price + (selectedPlan !== 'enterprise' ? additionalUsers * userPrice : 0);

  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  const formattedDate = nextBillingDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="mt-6 space-y-6">
      {/* Plans disponibles */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Choisissez votre plan</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const isCurrent = plan.id === 'premier';

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${plan.borderColor} shadow-lg scale-105`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white text-xs font-bold rounded-full shadow-md">
                      POPULAIRE
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Actif
                    </span>
                  </div>
                )}

                <div className={`p-6 rounded-t-xl bg-gradient-to-br ${plan.bgGradient}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <h4 className="text-xl font-bold text-[#3D2817] mb-2">{plan.name}</h4>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#3D2817]">{plan.price}€</span>
                    <span className="text-gray-600">/mois</span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        feature.available ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {feature.available ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <span className="text-gray-400 text-xs">✕</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${feature.available ? 'text-gray-900' : 'text-gray-400'}`}>
                          {feature.name}
                        </div>
                        {feature.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{feature.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 pt-0">
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrent ? 'Plan actuel' : isSelected ? 'Sélectionné' : 'Sélectionner'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Utilisateurs additionnels */}
      {selectedPlan !== 'enterprise' && (
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
      )}

      {/* Résumé et facturation */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-[#3D2817] mb-6">Résumé de facturation</h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-gray-700">
            <span>Plan {currentPlan.name}</span>
            <span className="font-medium">{currentPlan.price}€</span>
          </div>
          {additionalUsers > 0 && selectedPlan !== 'enterprise' && (
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
