import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, FileText, Globe, Share2, X, Check, Lock, ChevronRight } from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  provider: string;
}

interface Document {
  id: string;
  name: string;
}

interface SettingsNewProps {
  onNavigateToEmailConfig?: () => void;
}

export function SettingsNew({ onNavigateToEmailConfig }: SettingsNewProps = {}) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [autoSort, setAutoSort] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [adFilter, setAdFilter] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showImapModal, setShowImapModal] = useState(false);
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false);
  const [companyInfoStep, setCompanyInfoStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    company_name: '',
    activity_description: '',
    services_offered: '',
  });
  const [imapFormData, setImapFormData] = useState({
    email: '',
    password: '',
    imap_host: '',
    imap_port: '993',
  });

  useEffect(() => {
    loadAccounts();
    loadDocuments();
    checkCompanyInfo();
    loadCompanyData();
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    const { data: gmailAccounts } = await supabase
      .from('gmail_tokens')
      .select('id, email')
      .eq('user_id', user.id);

    const { data: outlookAccounts } = await supabase
      .from('outlook_tokens')
      .select('id, email')
      .eq('user_id', user.id);

    const allAccounts: EmailAccount[] = [
      ...(gmailAccounts || []).map(acc => ({ ...acc, provider: 'gmail' })),
      ...(outlookAccounts || []).map(acc => ({ ...acc, provider: 'outlook' })),
    ];

    setAccounts(allAccounts);
    if (allAccounts.length > 0) {
      setSelectedAccount(allAccounts[0]);
    }
  };

  const checkCompanyInfo = async () => {
    if (!user) return;

    const { data: config } = await supabase
      .from('email_configurations')
      .select('provider, company_name, activity_description')
      .eq('user_id', user.id)
      .maybeSingle();

    if (config && config.provider === 'gmail' && !config.activity_description) {
      setShowCompanyInfoModal(true);
      setCompanyInfoStep(2);
      if (config.company_name) {
        setCompanyFormData(prev => ({ ...prev, company_name: config.company_name || '' }));
      }
    }
  };

  const loadCompanyData = async () => {
    if (!user) return;

    const { data: config } = await supabase
      .from('email_configurations')
      .select('company_name, activity_description, services_offered')
      .eq('user_id', user.id)
      .maybeSingle();

    if (config) {
      setCompanyFormData({
        company_name: config.company_name || '',
        activity_description: config.activity_description || '',
        services_offered: config.services_offered || '',
      });
    }
  };

  const handleEditCompanyInfo = () => {
    setShowCompanyInfoModal(true);
    setCompanyInfoStep(1);
  };

  const loadDocuments = async () => {
    setDocuments([
      { id: '1', name: 'Document client 2024' },
      { id: '2', name: 'Politique commerciale' },
    ]);
  };

  const handleDeleteAccount = async (accountId: string, provider: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;

    const tableName = provider === 'gmail' ? 'gmail_tokens' : 'outlook_tokens';
    await supabase.from(tableName).delete().eq('id', accountId);
    loadAccounts();
  };

  const handleDeleteDocument = (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  const handleCompanyInfoNext = () => {
    if (companyInfoStep === 1 && !companyFormData.company_name) {
      alert('Veuillez entrer le nom de votre entreprise');
      return;
    }
    if (companyInfoStep === 2 && !companyFormData.activity_description) {
      alert('Veuillez décrire votre activité');
      return;
    }
    if (companyInfoStep < 3) {
      setCompanyInfoStep(companyInfoStep + 1);
    } else {
      handleCompanyInfoSubmit();
    }
  };

  const handleCompanyInfoBack = () => {
    if (companyInfoStep > 1) {
      setCompanyInfoStep(companyInfoStep - 1);
    }
  };

  const handleCompanyInfoSubmit = async () => {
    try {
      const { error } = await supabase
        .from('email_configurations')
        .update({
          company_name: companyFormData.company_name,
          activity_description: companyFormData.activity_description,
          services_offered: companyFormData.services_offered,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setShowCompanyInfoModal(false);
      setShowSuccessModal(true);
      setCompanyInfoStep(1);
      await loadCompanyData();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      alert('Erreur lors de l\'enregistrement des informations');
    }
  };

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
      window.open(authUrl, 'Gmail OAuth', `width=${width},height=${height},left=${left},top=${top}`);

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
              });
            }
          } catch (e) {
            console.error('Upsert config Gmail après OAuth:', e);
          }
          await loadAccounts();
          setShowAddAccountModal(false);
          setShowCompanyInfoModal(true);
          setCompanyInfoStep(1);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Erreur connexion Gmail:', err);
      alert('Erreur lors de la connexion Gmail');
    }
  };

  const handleProviderSelect = async (provider: 'gmail' | 'outlook' | 'imap') => {
    if (provider === 'gmail') {
      await connectGmail();
    } else if (provider === 'outlook') {
      window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-oauth-init?user_id=${user?.id}`;
    } else {
      setShowAddAccountModal(false);
      setShowImapModal(true);
    }
  };

  const handleImapSubmit = async () => {
    if (!imapFormData.email || !imapFormData.password || !imapFormData.imap_host) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('email_configurations')
        .select('id')
        .eq('user_id', user?.id as string)
        .eq('email', imapFormData.email)
        .maybeSingle();

      if (existing) {
        alert('Ce compte email existe déjà');
        return;
      }

      const { error } = await supabase.from('email_configurations').insert({
        user_id: user?.id as string,
        name: imapFormData.email,
        email: imapFormData.email,
        provider: 'smtp_imap',
        is_connected: true,
        password: imapFormData.password,
        imap_host: imapFormData.imap_host,
        imap_port: parseInt(imapFormData.imap_port),
        imap_username: imapFormData.email,
        imap_password: imapFormData.password,
      });

      if (error) throw error;

      setShowImapModal(false);
      setImapFormData({
        email: '',
        password: '',
        imap_host: '',
        imap_port: '993',
      });
      await loadAccounts();
      alert('Compte ajouté avec succès !');
    } catch (err) {
      console.error('Erreur ajout compte IMAP:', err);
      alert('Erreur lors de l\'ajout du compte');
    }
  };

  return (
    <>
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#3D2817] mb-2">Ajouter un compte email</h2>
              <p className="text-gray-600 text-sm">Sélectionnez votre fournisseur d'email</p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleProviderSelect('gmail')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    G
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Gmail</div>
                    <div className="text-sm text-gray-500">Google Workspace</div>
                  </div>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </button>

              <button
                onClick={() => handleProviderSelect('outlook')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 18h11v-2H7v2zm0-4h11v-2H7v2zm0-4h11V8H7v2zm14 8V6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Outlook</div>
                    <div className="text-sm text-gray-500">Microsoft 365</div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Bientôt</span>
              </button>

              <button
                onClick={() => handleProviderSelect('imap')}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">Autres emails</div>
                    <div className="text-sm text-gray-500">SMTP / IMAP</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#EF6855]" />
              </button>
            </div>

            <button
              onClick={() => setShowAddAccountModal(false)}
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-[#3D2817] mb-4">Mes comptes</h3>
            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'bg-[#EF6855] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{account.email}</div>
                  <div className={`text-xs ${
                    selectedAccount?.id === account.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-[#EF6855] text-[#EF6855] font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter un compte
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedAccount && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#3D2817]">{selectedAccount.email}</h2>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(selectedAccount.id, selectedAccount.provider)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {selectedAccount.provider === 'gmail' ? 'Gmail' : 'Outlook'}
              </p>
            </div>
          )}

          {selectedAccount?.provider === 'gmail' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#3D2817]">Informations de l'entreprise</h3>
                <button
                  onClick={handleEditCompanyInfo}
                  className="px-4 py-2 text-[#EF6855] border-2 border-[#EF6855] rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Nom de l'entreprise:</span>
                  <p className="font-medium text-gray-900">{companyFormData.company_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Description de l'activité:</span>
                  <p className="font-medium text-gray-900">{companyFormData.activity_description || 'Non renseignée'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Signature email:</span>
                  <p className="font-medium text-gray-900">{companyFormData.services_offered || 'Non renseignée'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-[#3D2817] mb-6">Fonctionnalités</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Tri automatique</div>
                  <div className="text-sm text-gray-600">Classement dans Info, Traités, Pub</div>
                </div>
                <button
                  onClick={() => setAutoSort(!autoSort)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    autoSort ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      autoSort ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Réponses automatiques</div>
                  <div className="text-sm text-gray-600">Génération de brouillons en IA</div>
                </div>
                <button
                  onClick={() => setAutoReply(!autoReply)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    autoReply ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      autoReply ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-[#3D2817] mb-6">Base de connaissances</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{doc.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-[#EF6855] text-[#EF6855] font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un document
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#3D2817]">Ressources avancées</h3>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                v2
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-colors opacity-50 cursor-not-allowed">
                <Globe className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Liens web</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-colors opacity-50 cursor-not-allowed">
                <Share2 className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Réseaux Sociaux</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {showCompanyInfoModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            {companyInfoStep > 1 && (
              <button
                onClick={handleCompanyInfoBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-gray-600" />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#3D2817]">Connexion</h2>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Étape {companyInfoStep}/3</span> - {
                companyInfoStep === 1 ? 'Authentification' :
                companyInfoStep === 2 ? 'Description de l\'entreprise' :
                'Signature'
              }
            </p>
          </div>

          {companyInfoStep === 1 && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={companyFormData.company_name}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, company_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Ex: Hall IA"
                />
              </div>
            </div>
          )}

          {companyInfoStep === 2 && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Description de l'activité
                </label>
                <textarea
                  value={companyFormData.activity_description}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, activity_description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Décrivez ce que fait votre entreprise..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {companyInfoStep === 3 && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Signature email
                </label>
                <textarea
                  value={companyFormData.services_offered}
                  onChange={(e) => setCompanyFormData({ ...companyFormData, services_offered: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="Votre signature d'email..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCompanyInfoNext}
              className="flex-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {companyInfoStep === 3 ? 'Terminer' : 'Continuer'}
            </button>
            <button
              onClick={() => {
                setShowCompanyInfoModal(false);
                setCompanyInfoStep(1);
                setCompanyFormData({
                  company_name: '',
                  activity_description: '',
                  services_offered: '',
                });
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    )}

    {showSuccessModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 text-center font-medium">
              Étape 3/3 - Configuration terminée
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-white stroke-[3]" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#3D2817] text-center mb-3">
            Compte ajouté !
          </h2>

          <p className="text-gray-600 text-center mb-8">
            Votre compte email est maintenant configuré et prêt à être utilisé.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[#3D2817] mb-4">Prochaines étapes :</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Vos emails commencent à être triés automatiquement</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Des brouillons de réponse sont générés</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Les publicités sont automatiquement filtrées</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-4 rounded-lg font-medium hover:shadow-lg transition-all text-lg"
          >
            Retourner aux paramètres
          </button>
        </div>
      </div>
    )}

    {showImapModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#3D2817] mb-2">Ajouter un compte IMAP</h2>
            <p className="text-gray-600 text-sm">Configurez votre compte email personnalisé</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#3D2817] mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={imapFormData.email}
                onChange={(e) => setImapFormData({ ...imapFormData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3D2817] mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={imapFormData.password}
                onChange={(e) => setImapFormData({ ...imapFormData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Serveur IMAP
                </label>
                <input
                  type="text"
                  value={imapFormData.imap_host}
                  onChange={(e) => setImapFormData({ ...imapFormData, imap_host: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="imap.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3D2817] mb-2">
                  Port IMAP
                </label>
                <input
                  type="text"
                  value={imapFormData.imap_port}
                  onChange={(e) => setImapFormData({ ...imapFormData, imap_port: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                  placeholder="993"
                />
              </div>
            </div>

          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImapSubmit}
              className="flex-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Ajouter le compte
            </button>
            <button
              onClick={() => {
                setShowImapModal(false);
                setImapFormData({
                  email: '',
                  password: '',
                  imap_host: '',
                  imap_port: '993',
                });
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
