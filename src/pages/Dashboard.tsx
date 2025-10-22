import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Settings, BarChart3, Users, CreditCard } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export function Dashboard() {
  const { subscription, loading, getActivePlan, isActive } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activePlan = getActivePlan();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-2 text-gray-600">
          Gérez vos emails et automatisations en toute simplicité
        </p>
      </div>

      {/* Subscription Status */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Statut de l'abonnement
                </h3>
                <p className="text-sm text-gray-600">
                  {activePlan ? (
                    <span className={isActive() ? 'text-green-600' : 'text-yellow-600'}>
                      {activePlan} - {isActive() ? 'Actif' : 'Inactif'}
                    </span>
                  ) : (
                    'Aucun abonnement actif'
                  )}
                </p>
              </div>
            </div>
            {!activePlan && (
              <Link
                to="/pricing"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Voir les plans
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Emails</h3>
              <p className="text-sm text-gray-600">Gérer vos emails</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Statistiques</h3>
              <p className="text-sm text-gray-600">Voir les métriques</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-gray-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
              <p className="text-sm text-gray-600">Paramètres système</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Équipe</h3>
              <p className="text-sm text-gray-600">Gérer les utilisateurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Activité récente</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600 text-center py-8">
            Aucune activité récente à afficher
          </p>
        </div>
      </div>
    </div>
  );
}