import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Mail, TrendingUp, Filter, Clock, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { SettingsNew } from './SettingsNew';
import { EmailConfigurations } from './EmailConfigurations';

type ActiveView = 'home' | 'settings' | 'email-configs';
type TimePeriod = 'today' | 'week' | 'month';

interface EmailStats {
  emailsRepondus: number;
  emailsTries: number;
  publicitiesFiltrees: number;
  emailsRepondusHier: number;
  emailsTriesHier: number;
  publicitiesHier: number;
  emailsInfo: number;
  emailsInfoHier: number;
}

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook';
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [stats, setStats] = useState<EmailStats>({
    emailsRepondus: 0,
    emailsTries: 0,
    publicitiesFiltrees: 0,
    emailsRepondusHier: 0,
    emailsTriesHier: 0,
    publicitiesHier: 0,
    emailsInfo: 0,
    emailsInfoHier: 0,
  });
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAccounts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && activeView === 'home' && selectedAccountId) {
      loadStats();
    }
  }, [user?.id, timePeriod, activeView, selectedAccountId]);

  const loadAccounts = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('email_configurations')
      .select('id, email, provider')
      .eq('user_id', user.id)
      .eq('is_connected', true);

    if (error) {
      console.error('Error loading accounts:', error);
      return;
    }

    const allAccounts: EmailAccount[] = (data || []).map(acc => ({
      id: acc.id,
      email: acc.email,
      provider: acc.provider as 'gmail' | 'outlook'
    }));

    setAccounts(allAccounts);
    if (allAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(allAccounts[0].id);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (timePeriod) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          previousStart: yesterday.toISOString(),
          previousEnd: today.toISOString(),
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const previousWeekStart = new Date(weekStart);
        previousWeekStart.setDate(weekStart.getDate() - 7);
        return {
          start: weekStart.toISOString(),
          end: now.toISOString(),
          previousStart: previousWeekStart.toISOString(),
          previousEnd: weekStart.toISOString(),
        };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: monthStart.toISOString(),
          end: now.toISOString(),
          previousStart: previousMonthStart.toISOString(),
          previousEnd: monthStart.toISOString(),
        };
    }
  };

  const loadStats = async () => {
    if (!user?.id || !selectedAccountId) {
      console.error('User ID or Account ID not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { start, end, previousStart, previousEnd } = getDateRange();

      const { count: emailsRepondus, error: error1 } = await supabase
        .from('email_traite')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error1) console.error('Error fetching emailsRepondus:', error1);

      const { count: emailsRepondusHier, error: error2 } = await supabase
        .from('email_traite')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      if (error2) console.error('Error fetching emailsRepondusHier:', error2);

      const { count: emailsTries, error: error3 } = await supabase
        .from('email_info')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error3) console.error('Error fetching emailsTries:', error3);

      const { count: emailsTriesHier, error: error4 } = await supabase
        .from('email_info')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      if (error4) console.error('Error fetching emailsTriesHier:', error4);

      const { count: publicitiesFiltrees, error: error5 } = await supabase
        .from('email_pub')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error5) console.error('Error fetching publicitiesFiltrees:', error5);

      const { count: publicitiesHier, error: error6 } = await supabase
        .from('email_pub')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      if (error6) console.error('Error fetching publicitiesHier:', error6);

      const totalEmailsTries = (emailsRepondus || 0) + (emailsTries || 0) + (publicitiesFiltrees || 0);
      const totalEmailsTriesHier = (emailsRepondusHier || 0) + (emailsTriesHier || 0) + (publicitiesHier || 0);

      setStats({
        emailsRepondus: emailsRepondus || 0,
        emailsTries: totalEmailsTries,
        publicitiesFiltrees: publicitiesFiltrees || 0,
        emailsRepondusHier: emailsRepondusHier || 0,
        emailsTriesHier: totalEmailsTriesHier,
        publicitiesHier: publicitiesHier || 0,
        emailsInfo: emailsTries || 0,
        emailsInfoHier: emailsTriesHier || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeSaved = () => {
    const totalMinutes =
      stats.emailsRepondus * 2 +
      stats.emailsInfo * 0.5 +
      stats.publicitiesFiltrees * (10 / 60);

    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);

    if (hours === 0 && mins === 0) return '0m';
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const getDiffText = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff === 0) return 'Aucun changement';
    const sign = diff > 0 ? '+' : '';
    const period = timePeriod === 'today' ? 'depuis hier' : 'vs période précédente';
    return `${sign}${diff} ${period}`;
  };

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
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                activeView === 'home'
                  ? 'text-[#EF6855] font-semibold'
                  : 'text-gray-600 hover:text-[#EF6855]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveView('email-configs')}
              className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                activeView === 'email-configs'
                  ? 'text-[#EF6855] font-semibold'
                  : 'text-gray-600 hover:text-[#EF6855]'
              }`}
            >
              <Mail className="w-5 h-5" />
              Configuration
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                activeView === 'settings'
                  ? 'text-[#EF6855] font-semibold'
                  : 'text-gray-600 hover:text-[#EF6855]'
              }`}
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
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Compte email</h2>
                <div className="relative">
                  <button
                    onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-[#EF6855] transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">
                      {accounts.find(acc => acc.id === selectedAccountId)?.email || 'Sélectionner un compte'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </button>
                  {showAccountDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10">
                      {accounts.map(account => (
                        <button
                          key={account.id}
                          onClick={() => {
                            setSelectedAccountId(account.id);
                            setShowAccountDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            selectedAccountId === account.id ? 'bg-orange-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{account.email}</div>
                          <div className="text-xs text-gray-500">
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                  {loading ? (
                    <div className="text-3xl font-bold text-[#3D2817] mb-1">...</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-[#3D2817] mb-1">{stats.emailsRepondus}</div>
                      <div className={`text-xs ${stats.emailsRepondus > stats.emailsRepondusHier ? 'text-green-600' : 'text-gray-600'}`}>
                        {getDiffText(stats.emailsRepondus, stats.emailsRepondusHier)}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Emails triés</span>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  {loading ? (
                    <div className="text-3xl font-bold text-[#3D2817] mb-1">...</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-[#3D2817] mb-1">{stats.emailsTries}</div>
                      <div className={`text-xs ${stats.emailsTries > stats.emailsTriesHier ? 'text-green-600' : 'text-gray-600'}`}>
                        {getDiffText(stats.emailsTries, stats.emailsTriesHier)}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Publicités filtrées</span>
                    <Filter className="w-5 h-5 text-purple-500" />
                  </div>
                  {loading ? (
                    <div className="text-3xl font-bold text-[#3D2817] mb-1">...</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-[#3D2817] mb-1">{stats.publicitiesFiltrees}</div>
                      <div className={`text-xs ${stats.publicitiesFiltrees > stats.publicitiesHier ? 'text-green-600' : 'text-gray-600'}`}>
                        {getDiffText(stats.publicitiesFiltrees, stats.publicitiesHier)}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white border-2 border-orange-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Temps économisé</span>
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  {loading ? (
                    <div className="text-3xl font-bold text-[#3D2817] mb-1">...</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-[#3D2817] mb-1">{calculateTimeSaved()}</div>
                      <div className="text-xs text-gray-600">
                        2 min/réponse + 30s/tri + 10s/pub filtrée
                      </div>
                    </>
                  )}
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
                      <span className="font-semibold text-gray-900">Dossier "INFO"</span>
                      <span className="text-gray-600"> - Emails informationnels</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-900">Dossier "TRAITE"</span>
                      <span className="text-gray-600"> - Emails traités</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-purple-50 rounded-lg p-4">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold text-gray-900">Dossier "PUB"</span>
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
