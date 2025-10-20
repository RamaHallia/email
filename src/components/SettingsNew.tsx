import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, FileText, Youtube, Globe, Zap } from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  provider: string;
}

interface Document {
  id: string;
  name: string;
}

export function SettingsNew() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [autoSort, setAutoSort] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [adFilter, setAdFilter] = useState(true);

  useEffect(() => {
    loadAccounts();
    loadDocuments();
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

  return (
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
              <button className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-[#EF6855] text-[#EF6855] font-medium hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
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

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Filtrage publicités</div>
                  <div className="text-sm text-gray-600">Isolation des emails commerciaux</div>
                </div>
                <button
                  onClick={() => setAdFilter(!adFilter)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    adFilter ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      adFilter ? 'translate-x-6' : 'translate-x-0'
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
            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-colors opacity-50 cursor-not-allowed">
                <Youtube className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Vidéos YouTube</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-colors opacity-50 cursor-not-allowed">
                <Globe className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Liens web</span>
              </button>
              <button className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#EF6855] hover:bg-orange-50 transition-colors opacity-50 cursor-not-allowed">
                <Zap className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">Templates</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
