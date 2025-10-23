import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Mail, TrendingUp, Filter, Clock, LogOut, LayoutDashboard, RefreshCw } from 'lucide-react';
import { SettingsNew } from './SettingsNew';
import { EmailConfigurations } from './EmailConfigurations';

type ActiveView = 'home' | 'settings';
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
  provider: 'gmail' | 'outlook' | 'smtp_imap';
  is_classement: boolean;
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
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isClassementActive, setIsClassementActive] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAccounts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeView === 'home' && user?.id) {
      loadAccounts();
    }
  }, [activeView, user?.id]);

  useEffect(() => {
    if (user?.id && activeView === 'home' && selectedEmail) {
      loadStats();
    }
  }, [user?.id, timePeriod, activeView, selectedEmail]);

  const loadAccounts = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('email_configurations')
      .select('id, email, provider, is_classement')
      .eq('user_id', user.id)
      .eq('is_connected', true);

    if (error) {
      console.error('Error loading accounts:', error);
      return;
    }

    const allAccounts: EmailAccount[] = (data || []).map(acc => ({
      id: acc.id,
      email: acc.email,
      provider: acc.provider as 'gmail' | 'outlook' | 'smtp_imap',
      is_classement: acc.is_classement ?? true
    }));

    setAccounts(allAccounts);

    if (allAccounts.length === 0) {
      setSelectedAccountId(null);
      setSelectedEmail(null);
      setIsClassementActive(false);
      return;
    }

    const currentAccountStillExists = allAccounts.find(acc => acc.id === selectedAccountId);

    if (!currentAccountStillExists) {
      setSelectedAccountId(allAccounts[0].id);
      setSelectedEmail(allAccounts[0].email);
      setIsClassementActive(allAccounts[0].is_classement);
    } else {
      setIsClassementActive(currentAccountStillExists.is_classement);
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
    if (!user?.id || !selectedEmail) {
      console.error('User ID or Email not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { start, end, previousStart, previousEnd } = getDateRange();

      const { count: emailsRepondus, error: error1 } = await supabase
        .from('email_traite')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error1) console.error('Error fetching emailsRepondus:', error1);

      const { count: emailsRepondusHier, error: error2 } = await supabase
        .from('email_traite')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      if (error2) console.error('Error fetching emailsRepondusHier:', error2);

      const { count: emailsTries, error: error3 } = await supabase
        .from('email_info')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error3) console.error('Error fetching emailsTries:', error3);

      const { count: emailsTriesHier, error: error4 } = await supabase
        .from('email_info')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd);

      if (error4) console.error('Error fetching emailsTriesHier:', error4);

      const { count: publicitiesFiltrees, error: error5 } = await supabase
        .from('email_pub')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
        .gte('created_at', start)
        .lt('created_at', end);

      if (error5) console.error('Error fetching publicitiesFiltrees:', error5);

      const { count: publicitiesHier, error: error6 } = await supabase
        .from('email_pub')
        .select('*', { count: 'exact', head: true })
        .eq('email', selectedEmail)
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
      stats.publicitiesFiltrees * 0.17;

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

            <div className={`bg-white rounded-xl p-6 shadow-sm border ${accounts.length === 0 || !isClassementActive ? 'border-gray-200' : 'border-orange-100'}`}>
              <h3 className="text-base font-semibold text-[#3D2817] mb-4 text-center">Flux de traitement automatique</h3>
              <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto">
                {/* Email entrant */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${accounts.length === 0 || !isClassementActive ? 'bg-gray-300' : 'bg-gradient-to-br from-[#EF6855] to-[#F9A459] animate-pulse'}`}>
                      <Mail className={`w-6 h-6 ${accounts.length === 0 || !isClassementActive ? 'text-gray-500' : 'text-white'}`} />
                    </div>
                    {accounts.length > 0 && isClassementActive && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                        <span className="text-white text-[8px] font-bold">!</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-600">Email</p>
                </div>

                {/* Flèche animée */}
                <div className="flex-1 px-2 max-w-[80px]">
                  <div className={`relative h-0.5 rounded-full overflow-hidden ${accounts.length === 0 || !isClassementActive ? 'bg-gray-200' : 'bg-gradient-to-r from-orange-200 to-orange-300'}`}>
                    {accounts.length > 0 && isClassementActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                    )}
                  </div>
                </div>

                {/* AI Processing */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${accounts.length === 0 || !isClassementActive ? 'bg-gray-300' : 'bg-gradient-to-br from-[#EF6855] to-[#F9A459] animate-spin-slow'}`}>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <RefreshCw className={`w-5 h-5 ${accounts.length === 0 || !isClassementActive ? 'text-gray-500' : 'text-[#EF6855]'}`} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-600">IA</p>
                </div>

                {/* Flèche animée */}
                <div className="flex-1 px-2 max-w-[80px]">
                  <div className={`relative h-0.5 rounded-full overflow-hidden ${accounts.length === 0 || !isClassementActive ? 'bg-gray-200' : 'bg-gradient-to-r from-orange-300 to-orange-200'}`}>
                    {accounts.length > 0 && isClassementActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                    )}
                  </div>
                </div>

                {/* 3 Dossiers */}
                <div className="flex gap-2">
                  <div className={`flex flex-col items-center ${accounts.length > 0 && isClassementActive ? 'animate-slide-in-1' : ''}`}>
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-md ${accounts.length === 0 || !isClassementActive ? 'bg-gray-300' : 'bg-gradient-to-br from-green-500 to-green-600'}`}>
                      <span className={`text-sm font-bold ${accounts.length === 0 || !isClassementActive ? 'text-gray-500' : 'text-white'}`}>✓</span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-gray-600">TRAITÉ</p>
                  </div>
                  <div className={`flex flex-col items-center ${accounts.length > 0 && isClassementActive ? 'animate-slide-in-2' : ''}`}>
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-md ${accounts.length === 0 || !isClassementActive ? 'bg-gray-300' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                      <span className={`text-sm font-bold ${accounts.length === 0 || !isClassementActive ? 'text-gray-500' : 'text-white'}`}>✖</span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-gray-600">PUB</p>
                  </div>
                  <div className={`flex flex-col items-center ${accounts.length > 0 && isClassementActive ? 'animate-slide-in-3' : ''}`}>
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-md ${accounts.length === 0 || !isClassementActive ? 'bg-gray-300' : 'bg-gradient-to-br from-[#EF6855] to-[#F9A459]'}`}>
                      <span className={`text-sm font-bold ${accounts.length === 0 || !isClassementActive ? 'text-gray-500' : 'text-white'}`}>i</span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-gray-600">INFO</p>
                  </div>
                </div>
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#EF6855]" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-[#3D2817] mb-2">
                  Aucun compte email configuré
                </h2>
                <p className="text-gray-600 mb-6">
                  Ajoutez votre premier compte email pour commencer à utiliser Hall IA
                </p>
                <button
                  onClick={() => setActiveView('settings')}
                  className="px-6 py-3 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Ajouter un compte
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">Compte email</h2>
                  <div className="flex flex-wrap gap-3">
                    {accounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountId(account.id);
                          setSelectedEmail(account.email);
                          setIsClassementActive(account.is_classement);
                        }}
                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                          selectedAccountId === account.id
                            ? 'bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white border-transparent shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#EF6855]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{account.email}</span>
                        </div>
                      </button>
                    ))}
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
                  <button
                    onClick={() => loadStats()}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg font-medium transition-all bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
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
            )}

          </div>
        )}

        {activeView === 'settings' && (
          <>
            <div className="mb-6 bg-gradient-to-br from-orange-50 to-white rounded-lg p-6 shadow-sm border border-orange-100">
              <h2 className="text-lg font-bold text-[#3D2817] mb-2 text-center">
                Comment fonctionne Hall IA
              </h2>
              <p className="text-sm text-gray-600 text-center mb-8">Suivez le parcours de vos emails en 4 étapes simples</p>

              <div className="relative">
                <style>{`
                  @keyframes dashProgress {
                    0% {
                      stroke-dashoffset: 1000;
                    }
                    100% {
                      stroke-dashoffset: 0;
                    }
                  }
                  @keyframes fadeInUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                  }
                  .dashed-path {
                    stroke-dasharray: 8 8;
                    stroke-dashoffset: 1000;
                    animation: dashProgress 3s ease-out forwards;
                  }
                  .step-card-1 {
                    animation: fadeInUp 0.6s ease-out 0.2s backwards;
                  }
                  .step-card-2 {
                    animation: fadeInUp 0.6s ease-out 0.4s backwards;
                  }
                  .step-card-3 {
                    animation: fadeInUp 0.6s ease-out 0.6s backwards;
                  }
                  .step-card-4 {
                    animation: fadeInUp 0.6s ease-out 0.8s backwards;
                  }
                  .step-badge {
                    animation: pulse 2s ease-in-out infinite;
                  }
                `}</style>

                <svg className="hidden lg:block absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
                  <path
                    d="M 12.5% 50 L 37.5% 50 M 37.5% 50 L 62.5% 50 M 62.5% 50 L 87.5% 50"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    fill="none"
                    className="dashed-path"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="33%" stopColor="#22C55E" />
                      <stop offset="66%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF6855" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative" style={{zIndex: 1}}>
                  <div className="relative step-card-1">
                    <div className="text-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-blue-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-base font-bold mx-auto mb-2 shadow step-badge">
                        1
                      </div>
                      <div className="text-xs text-blue-600 font-semibold mb-1">ÉTAPE 1</div>
                      <h3 className="font-bold text-sm text-[#3D2817] mb-2">Créer un compte email</h3>
                      <p className="text-xs text-gray-600">
                        Configurez votre compte email
                      </p>
                    </div>
                  </div>

                  <div className="relative step-card-2">
                    <div className="text-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-green-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-base font-bold mx-auto mb-2 shadow step-badge" style={{animationDelay: '0.2s'}}>
                        2
                      </div>
                      <div className="text-xs text-green-600 font-semibold mb-1">ÉTAPE 2</div>
                      <h3 className="font-bold text-sm text-[#3D2817] mb-2">Description de l'activité</h3>
                      <p className="text-xs text-gray-600">
                        Décrivez votre entreprise pour personnaliser les réponses automatiques
                      </p>
                    </div>
                  </div>

                  <div className="relative step-card-3">
                    <div className="text-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-amber-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-base font-bold mx-auto mb-2 shadow step-badge" style={{animationDelay: '0.4s'}}>
                        3
                      </div>
                      <div className="text-xs text-amber-600 font-semibold mb-1">ÉTAPE 3</div>
                      <h3 className="font-bold text-sm text-[#3D2817] mb-2">Classification & Réponse</h3>
                      <p className="text-xs text-gray-600">
                        Tri automatique dans les 3 dossiers TRAITÉ, PUB et INFO + brouillon de réponse
                      </p>
                    </div>
                  </div>

                  <div className="relative step-card-4">
                    <div className="text-center bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-orange-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#EF6855] to-[#F9A459] rounded-full flex items-center justify-center text-white text-base font-bold mx-auto mb-2 shadow step-badge" style={{animationDelay: '0.6s'}}>
                        4
                      </div>
                      <div className="text-xs text-orange-600 font-semibold mb-1">ÉTAPE 4</div>
                      <h3 className="font-bold text-sm text-[#3D2817] mb-2">Validez et envoyez</h3>
                      <p className="text-xs text-gray-600">
                        Vérifiez la réponse proposée et envoyez-la depuis la boîte Brouillons
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-sm text-[#3D2817] mb-3">Résultats automatiques :</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">Dossier "INFO"</span>
                      <span className="text-gray-600"> - Emails informationnels</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-green-50 rounded-lg p-3">
                    <svg className="w-4 h-4 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">Dossier "TRAITE"</span>
                      <span className="text-gray-600"> - Emails traités</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3">
                    <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">Dossier "PUB"</span>
                      <span className="text-gray-600"> - Publicités filtrées</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-[#3D2817] mb-2">
                  Paramètres
                </h1>
                <p className="text-gray-600">
                  Gérez vos comptes email et configuration
                </p>
              </div>
            </div>

            <SettingsNew onNavigateToEmailConfig={() => {}} />
          </>
        )}


      </main>
    </div>
  );
}
