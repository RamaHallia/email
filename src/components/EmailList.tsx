import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, RefreshCw, Inbox, CheckCircle, AlertCircle } from 'lucide-react';

interface Email {
  id: string;
  message_id: string;
  email: string;
  subject: string;
  sender: string;
  body: string;
  received_date: string;
  created_at: string;
  email_account_id: string | null;
}

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'smtp_imap';
}

type EmailCategory = 'info' | 'pub' | 'traite';

export function EmailList() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState<EmailCategory>('traite');

  const tableName = category === 'info' ? 'email_info'
                  : category === 'pub' ? 'email_pub'
                  : 'email_traite';

  const categoryConfig = {
    info: {
      title: 'Emails informationnels',
      icon: Inbox,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-600'
    },
    pub: {
      title: 'Publicités',
      icon: AlertCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600'
    },
    traite: {
      title: 'Emails traités',
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-600'
    }
  };

  const config = categoryConfig[category];
  const Icon = config.icon;

  useEffect(() => {
    if (user?.id) {
      loadAccounts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && selectedAccountId) {
      loadEmails();
    }
  }, [user?.id, selectedAccountId, category]);

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
      provider: acc.provider as 'gmail' | 'outlook' | 'smtp_imap'
    }));

    setAccounts(allAccounts);

    if (allAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(allAccounts[0].id);
    }
  };

  const loadEmails = async () => {
    if (!user?.id || !selectedAccountId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .eq('email_account_id', selectedAccountId)
        .order('received_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error(`Error loading emails from ${tableName}:`, error);
        return;
      }

      setEmails(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center shadow-sm">
        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucun compte email configuré</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${config.textColor}`} />
            <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
            <span className={`px-3 py-1 ${config.bgColor} ${config.textColor} rounded-full text-sm font-medium`}>
              {emails.length}
            </span>
          </div>
          <button
            onClick={loadEmails}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-[#EF6855] transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Compte email</label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EF6855] transition-colors"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">Catégorie</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCategory('traite')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  category === 'traite'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Traités
              </button>
              <button
                onClick={() => setCategory('info')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  category === 'info'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setCategory('pub')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  category === 'pub'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pub
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && emails.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin w-8 h-8 border-4 border-[#EF6855] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des emails...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className={`${config.bgColor} rounded-xl p-12 text-center border-2 ${config.borderColor}`}>
          <Icon className={`w-12 h-12 ${config.textColor} mx-auto mb-4`} />
          <p className="text-gray-600">Aucun email dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            {emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 bg-white border-2 rounded-lg transition-all ${
                  selectedEmail?.id === email.id
                    ? `${config.borderColor} ${config.bgColor}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 truncate flex-1">
                    {email.subject || '(Sans sujet)'}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatDate(email.received_date)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">De: {email.sender}</p>
                <p className="text-xs text-gray-400 truncate">{email.body.substring(0, 100)}...</p>
              </button>
            ))}
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sticky top-4 h-fit max-h-[600px] overflow-y-auto">
            {selectedEmail ? (
              <div>
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedEmail.subject || '(Sans sujet)'}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold">De:</span> {selectedEmail.sender}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">À:</span> {selectedEmail.email}
                    </p>
                    <p className="text-gray-500">
                      {new Date(selectedEmail.received_date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sélectionnez un email pour voir son contenu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
