import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Mail, TrendingUp, Filter, Clock, LogOut } from 'lucide-react';
import { SettingsNew } from './SettingsNew';
import { EmailConfigurations } from './EmailConfigurations';

type ActiveView = 'home' | 'settings' | 'email-configs';
type TimePeriod = 'today' | 'week' | 'month';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#EF6855] to-[#F9A459] rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#3D2817]">Hall IA</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#EF6855] transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              Paramètres
            </button>
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-gray-600 hover:text-[#EF6855] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'home' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-[#3D2817] mb-2">
                Tableau de bord
              </h1>
              <p className="text-gray-600">
                Vue d'ensemble de vos emails traités et temps économisé
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Période</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTimePeriod('today')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      timePeriod === 'today'
                        ? 'bg-[#EF6855] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => setTimePeriod('week')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      timePeriod === 'week'
                        ? 'bg-[#EF6855] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cette semaine
                  </button>
                  <button
                    onClick={() => setTimePeriod('month')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      timePeriod === 'month'
                        ? 'bg-[#EF6855] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Ce mois
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Emails répondus</span>
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-[#3D2817] mb-1">42</div>
                  <div className="text-xs text-green-600">+5 depuis hier</div>
                </div>

                <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Emails triés</span>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-[#3D2817] mb-1">128</div>
                  <div className="text-xs text-green-600">+12 depuis hier</div>
                </div>

                <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Publicités filtrées</span>
                    <Filter className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-[#3D2817] mb-1">89</div>
                  <div className="text-xs text-green-600">+8 depuis hier</div>
                </div>

                <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Temps économisé</span>
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-[#3D2817] mb-1">2h 28m</div>
                  <div className="text-xs text-gray-600">
                    Basé sur 2 min/email répondu + 30s/email trié
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#3D2817] mb-8">
                Comment fonctionne Hall IA
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center bg-blue-50 rounded-xl p-6">
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    1
                  </div>
                  <h3 className="font-bold text-[#3D2817] mb-2">Réception du mail</h3>
                  <p className="text-sm text-gray-600">
                    Un email arrive dans votre boîte de réception
                  </p>
                </div>

                <div className="text-center bg-green-50 rounded-xl p-6">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    2
                  </div>
                  <h3 className="font-bold text-[#3D2817] mb-2">Analyse IA</h3>
                  <p className="text-sm text-gray-600">
                    Notre IA analyse le contenu et le contexte
                  </p>
                </div>

                <div className="text-center bg-purple-50 rounded-xl p-6">
                  <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    3
                  </div>
                  <h3 className="font-bold text-[#3D2817] mb-2">Classification & Réponse</h3>
                  <p className="text-sm text-gray-600">
                    Tri automatique + brouillon de réponse
                  </p>
                </div>

                <div className="text-center bg-orange-50 rounded-xl p-6">
                  <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    4
                  </div>
                  <h3 className="font-bold text-[#3D2817] mb-2">Vous validez</h3>
                  <p className="text-sm text-gray-600">
                    Vérifiez et envoyez la réponse
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <h3 className="font-semibold text-[#3D2817] mb-4">Résultats automatiques :</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-900">Dossier "Info"</span>
                      <span className="text-gray-600"> - Emails informationnels</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-900">Dossier "Traités"</span>
                      <span className="text-gray-600"> - Emails traités</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-purple-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-900">Dossier "Pub"</span>
                      <span className="text-gray-600"> - Publicités filtrées</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#3D2817] mb-2">
                Paramètres
              </h1>
              <p className="text-gray-600">
                Gérez vos comptes email et configuration
              </p>
            </div>
            <SettingsNew />
          </>
        )}

        {activeView === 'email-configs' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#3D2817] mb-2">
                Comptes configurés
              </h1>
              <p className="text-gray-600">
                Gérez vos comptes email connectés
              </p>
            </div>
            <EmailConfigurations />
          </>
        )}
      </main>
    </div>
  );
}
