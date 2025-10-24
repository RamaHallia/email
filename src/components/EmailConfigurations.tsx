import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle, Plus } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { ConfigurationModal } from './ConfigurationModal';

type SimpleConfigRow = {
  id: string;
  user_id: string;
  email: string;
  password: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  imap_host: string | null;
  imap_port: number | null;
  provider?: string | null;
  is_connected?: boolean | null;
  company_name: string | null;
  activity_description: string | null;
  services_offered: string | null;
  gmail_token_id: string | null;
  outlook_token_id: string | null;
  created_at: string;
};

export function EmailConfigurations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SimpleConfigRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'choices' | 'imap_form' | 'account' | 'list'>('choices');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Formulaire simplifié selon votre JSON
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    imap_host: '',
    imap_port: '993',
    company_name: '',
    activity_description: '',
    services_offered: '',
  });

  useEffect(() => {
    (async () => {
      await loadLatestConfig();
    })();
  }, []);

  // Listener global pour capter les messages OAuth même si la page a rerendu
  useEffect(() => {
    const oauthHandler = async (event: MessageEvent) => {
      if (event?.data?.type === 'gmail-connected' || event?.data?.type === 'outlook-connected') {
        try {
          const provider = event.data.type === 'gmail-connected' ? 'gmail' : 'outlook';
          const { data: existing } = await supabase
            .from('email_configurations')
            .select('id')
            .eq('user_id', user?.id as string)
            .eq('email', event.data.email || '')
            .maybeSingle();

          if (!existing) {
            await supabase.from('email_configurations').insert({
              user_id: user?.id as string,
              name: event.data.email || provider,
              email: event.data.email || '',
              provider,
              is_connected: true,
            });
          }
        } catch (e) {
          console.error('Upsert config après OAuth (global handler):', e);
        }
        await loadLatestConfig();
        setMode('account');
      } else if (event?.data?.type === 'outlook-error') {
        const err = event?.data?.error || 'Erreur inconnue';
        const desc = event?.data?.description || '';
        alert(`Outlook OAuth a échoué: ${err}${desc ? ` - ${desc}` : ''}`);
      }
    };
    window.addEventListener('message', oauthHandler);
    return () => window.removeEventListener('message', oauthHandler);
  }, [user?.id]);

  const loadLatestConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const list = data || [];
      setItems(list);
      if (list.length === 0) {
        const { data: gmail } = await supabase
          .from('gmail_tokens')
          .select('email')
          .eq('user_id', user?.id)
          .maybeSingle();
        if (gmail?.email) {
          const { data: existing } = await supabase
            .from('email_configurations')
            .select('id')
            .eq('user_id', user?.id as string)
            .eq('email', gmail.email)
            .maybeSingle();

          if (!existing) {
            await supabase.from('email_configurations').insert({
              user_id: user?.id as string,
              name: gmail.email,
              email: gmail.email,
              provider: 'gmail',
              is_connected: true,
            });
          }
          const { data: after } = await supabase
            .from('email_configurations')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setItems(after || []);
          setMode((after && after.length > 0) ? 'account' : 'choices');
          return;
        }
      }
      setMode(list.length > 0 ? 'account' : 'choices');
      if (list.length > 0) {
        const c = list[0] as any;
        setFormData({
          email: c.email || '',
          password: c.password || '',
          imap_host: c.imap_host || '',
          imap_port: String(c.imap_port ?? '993'),
          company_name: c.company_name || '',
          activity_description: c.activity_description || '',
          services_offered: c.services_offered || '',
        });
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // OAuth Gmail
  const connectGmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-init`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ redirectUrl: window.location.origin }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec de l\'initialisation Gmail');
      }
      const { authUrl } = await response.json();
      const width = 600; const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(authUrl, 'Gmail OAuth', `width=${width},height=${height},left=${left},top=${top}`);

      if (!popup) {
        alert('Le popup a été bloqué. Veuillez autoriser les popups pour ce site.');
        return;
      }

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'gmail-connected') {
          try {
            const { data: existing } = await supabase
              .from('email_configurations')
              .select('id')
              .eq('user_id', user?.id as string)
              .eq('email', event.data.email || '')
              .maybeSingle();

            if (!existing) {
              await supabase.from('email_configurations').insert({
                user_id: user?.id as string,
                name: event.data.email || 'Gmail',
                email: event.data.email || '',
                provider: 'gmail',
                is_connected: true,
                company_name: null,
                activity_description: null,
                services_offered: null,
              });
            }
          } catch (e) {
            console.error('Upsert config Gmail après OAuth:', e);
          }
          await loadLatestConfig();
          setMode('account');
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'gmail-duplicate') {
          alert(`Le compte ${event.data.email} est déjà configuré.`);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);

      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    } catch (err) {
      console.error('Erreur connexion Gmail:', err);
      alert('Erreur lors de la connexion Gmail');
    }
  };


  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  const disconnectOutlook = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('outlook_tokens')
        .delete()
        .eq('user_id', user.id);

      const { error: updateError } = await supabase
        .from('email_configurations')
        .update({ is_connected: false })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      await loadLatestConfig();
    } catch (err) {
      console.error('Erreur déconnexion Outlook:', err);
      alert('Impossible de déconnecter Outlook pour le moment.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const cfg = items[0];
      const isEditingGmail = cfg?.provider === 'gmail';

      if (isEditingGmail || isEditingOutlook) {
        // Pour Gmail/Outlook, mise à jour uniquement des infos entreprise
        const { error } = await supabase
          .from('email_configurations')
          .update({
            company_name: formData.company_name,
            activity_description: formData.activity_description,
            services_offered: formData.services_offered,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('provider', isEditingGmail ? 'gmail' : 'outlook');

        if (error) throw error;
      } else {
        // Pour IMAP/SMTP, upsert complet
        const cfg = items.find(c => c.id === selectedConfigId);
        if (cfg?.id) {
          const updateRes = await supabase
            .from('email_configurations')
            .update({
              email: formData.email,
              password: formData.password,
              imap_host: formData.imap_host,
              imap_port: parseInt(formData.imap_port),
              imap_username: formData.email,
              imap_password: formData.password,
              company_name: formData.company_name,
              activity_description: formData.activity_description,
              services_offered: formData.services_offered,
            })
            .eq('id', cfg.id);
          if (updateRes.error) throw updateRes.error;
        } else {
          const insertRes = await supabase.from('email_configurations').insert({
            user_id: user.id,
            name: formData.company_name || formData.email,
            email: formData.email,
            provider: 'smtp_imap',
            is_connected: true,
            password: formData.password,
            imap_host: formData.imap_host,
            imap_port: parseInt(formData.imap_port),
            imap_username: formData.email,
            imap_password: formData.password,
            company_name: formData.company_name,
            activity_description: formData.activity_description,
            services_offered: formData.services_offered,
          });
          if (insertRes.error) throw insertRes.error;
        }
      }

      await loadLatestConfig();
      if (!isEditingGmail && !isEditingOutlook) {
        setFormData({
          email: '',
          password: '',
          imap_host: '',
          imap_port: '993',
          company_name: '',
          activity_description: '',
          services_offered: '',
        });
      }
      setMode('account');
      alert('Configuration enregistrée/mise à jour avec succès.');
    } catch (err) {
      console.error('Erreur enregistrement:', err);
      alert("Une erreur est survenue lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    try {
      const cfg = items[0];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Vous devez être connecté');
        return;
      }

      const { data: allConfigs } = await supabase
        .from('email_configurations')
        .select('id')
        .eq('user_id', user.id);

      const totalAccountsBeforeDeletion = allConfigs?.length || 0;

      if (cfg?.provider === 'gmail' && cfg?.gmail_token_id) {
        const { error: tokenError } = await supabase
          .from('gmail_tokens')
          .delete()
          .eq('id', cfg.gmail_token_id);
        if (tokenError) console.error('Erreur suppression token Gmail:', tokenError);
      }

      if (cfg?.provider === 'outlook' && cfg?.outlook_token_id) {
        const { error: tokenError } = await supabase
          .from('outlook_tokens')
          .delete()
          .eq('id', cfg.outlook_token_id);
        if (tokenError) console.error('Erreur suppression token Outlook:', tokenError);
      }

      const { error } = await supabase
        .from('email_configurations')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;

      if (totalAccountsBeforeDeletion > 1) {
        try {
          const totalAccountsAfterDeletion = totalAccountsBeforeDeletion - 1;
          const newAdditionalAccounts = Math.max(0, totalAccountsAfterDeletion - 1);

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-update-subscription`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                additional_accounts: newAdditionalAccounts,
              }),
            }
          );

          const data = await response.json();
          if (data.error) {
            console.error('Erreur mise à jour Stripe:', data.error);
          }
        } catch (stripeError) {
          console.error('Erreur lors de la mise à jour de l\'abonnement:', stripeError);
        }
      }

      await loadLatestConfig();
      setFormData({
        email: '',
        password: '',
        imap_host: '',
        imap_port: '993',
        company_name: '',
        activity_description: '',
        services_offered: '',
      });
      setMode('choices');
      alert('Configuration supprimée et abonnement mis à jour.');
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Impossible de supprimer la configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EF6855]"></div>
      </div>
    );
  }

  // CHOICES VIEW
  if (mode === 'choices') {
    const hasGmail = items.some(c => c.provider === 'gmail' && c.is_connected);
    const hasOutlook = items.some(c => c.provider === 'outlook' && c.is_connected);
    const hasIMAP = items.some(c => c.provider === 'smtp_imap' && c.is_connected);
    const hasAnyConnection = hasGmail || hasOutlook || hasIMAP;

    return (
      <>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-[#EF6855]" />
              <div>
                <h2 className="text-2xl font-bold text-[#3D2817]">Configurations Email</h2>
                <p className="text-gray-600 mt-1">Connectez un compte email</p>
              </div>
            </div>
            {!hasAnyConnection && (
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Ajouter un compte
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl p-10 shadow-sm text-center border border-gray-200">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-[#EF6855]" />
              </div>
              <h3 className="text-xl font-semibold text-[#3D2817] mb-2">
                Aucun compte configuré
              </h3>
              <p className="text-gray-600">
                Connectez votre première adresse email pour commencer
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
            >
              <Plus className="w-6 h-6" />
              Connecter un compte email
            </button>
          </div>
        </div>

        <ConfigurationModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onComplete={loadLatestConfig}
          onNavigateToOther={() => setMode('imap_form')}
        />
      </>
    );
  }

  // ACCOUNT VIEW (after configured)
  if (mode === 'account') {
    const cfg = items[0];
    const providerLabel = cfg?.provider === 'gmail' ? 'Gmail' : cfg?.provider === 'outlook' ? 'Outlook' : 'IMAP';
    const hasCompanyInfo = cfg?.company_name || cfg?.activity_description || cfg?.services_offered;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-[#EF6855]" />
          <div>
            <h2 className="text-2xl font-bold text-[#3D2817]">Compte configuré</h2>
            <p className="text-gray-600 mt-1">Cliquez pour modifier ou supprimez</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {cfg?.is_connected ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Connecté
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium">
                  <span className="w-4 h-4 inline-block rounded-full bg-gray-400"></span>
                  Déconnecté
                </div>
              )}
              <div className="text-left">
                <div className="font-semibold text-[#3D2817]">{cfg?.email}</div>
                <div className="text-sm text-gray-500">
                  {providerLabel}
                  {cfg?.provider === 'smtp_imap' && cfg?.imap_host ? ` · IMAP: ${cfg.imap_host}:${cfg.imap_port}` : ''}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {(cfg?.provider === 'smtp_imap' || cfg?.provider === 'gmail') && (
                <button
                  type="button"
                  onClick={() => setMode('imap_form')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Modifier
                </button>
              )}
              {cfg?.provider === 'outlook' && cfg?.is_connected && (
                <button
                  type="button"
                  onClick={handleDisconnectClick}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Déconnecter
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </div>

          {hasCompanyInfo && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-[#3D2817] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#EF6855]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Informations de l'entreprise
              </h3>
              <div className="space-y-4">
                {cfg?.company_name && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Nom de l'entreprise</div>
                    <div className="text-gray-900">{cfg.company_name}</div>
                  </div>
                )}
                {cfg?.activity_description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Description de l'activité</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{cfg.activity_description}</div>
                  </div>
                )}
                {cfg?.services_offered && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Signature</div>
                    <div className="text-gray-900 whitespace-pre-wrap">{cfg.services_offered}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasCompanyInfo && cfg?.provider === 'gmail' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <svg className="w-5 h-5 text-[#EF6855] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold text-[#3D2817] mb-1">Configuration incomplète</div>
                  <div className="text-sm text-gray-700 mb-3">
                    Ajoutez les informations de votre entreprise pour personnaliser les réponses de l'IA.
                  </div>
                  <button
                    onClick={() => setMode('imap_form')}
                    className="text-sm font-medium text-[#EF6855] hover:text-[#d55a47] transition-colors"
                  >
                    Compléter maintenant →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // IMAP FORM VIEW
  const cfg = items[0];
  const isEditingGmail = cfg?.provider === 'gmail';
  const isEditingOutlook = cfg?.provider === 'outlook';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="w-6 h-6 text-[#EF6855]" />
        <div>
          <h2 className="text-2xl font-bold text-[#3D2817]">
            {(isEditingGmail || isEditingOutlook) ? 'Modifier les informations' : 'Configuration Email'}
          </h2>
          <p className="text-gray-600 mt-1">
            {(isEditingGmail || isEditingOutlook) ? 'Mettez à jour les informations de votre entreprise' : 'Configurez vos paramètres de messagerie'}
          </p>
        </div>
      </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#EF6855]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isEditingGmail && !isEditingOutlook && (
            <>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Informations de connexion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                      placeholder="exemple@entreprise.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Configuration IMAP</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Serveur IMAP Entrant</label>
                    <input
                      type="text"
                      required
                      value={formData.imap_host}
                      onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                      placeholder="imap.exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Port IMAP</label>
                    <input
                      type="number"
                      required
                      value={formData.imap_port}
                      onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {(isEditingGmail || isEditingOutlook) && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold mb-1">Compte {isEditingGmail ? 'Gmail' : 'Outlook'} connecté</div>
                  <div>Vous pouvez uniquement modifier les informations de votre entreprise. Les paramètres de connexion {isEditingGmail ? 'Gmail' : 'Outlook'} sont gérés automatiquement.</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Informations de l'entreprise</h3>
            <div className="grid grid-cols-1 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
                  <input
                    type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Nom de votre entreprise"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'activité</label>
                <textarea
                  value={formData.activity_description}
                  onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Décrivez l'activité principale..."
                  rows={3}
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                <textarea
                  value={formData.services_offered}
                  onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Listez vos services..."
                  rows={3}
                />
              </div>
            </div>
        </div>

          <div className="pt-2">
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 bg-[#EF6855] text-white py-3 rounded-lg font-medium hover:bg-[#d55a47] transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              {(isEditingGmail || isEditingOutlook) ? (
                <button
                  type="button"
                  onClick={() => setMode('account')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-6 py-3 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </form>
        </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-4 py-3 border-b font-medium text-gray-700">Dernières configurations</div>
          <ul className="divide-y">
            {items.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
                <span className="truncate">{row.email}</span>
                <span className="text-gray-500">
                  {new Date(row.created_at).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={disconnectOutlook}
        title="Déconnecter le compte"
        message={`Êtes-vous sûr de vouloir déconnecter ${items[0]?.email} ? Vous pourrez vous reconnecter à tout moment.`}
        confirmText="Déconnecter"
        cancelText="Annuler"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la configuration"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la configuration de ${items[0]?.email} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
}
