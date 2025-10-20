import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ConfigurationModal({ isOpen, onClose, onComplete }: ConfigurationModalProps) {
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const [imapForm, setImapForm] = useState({
    email: '',
    password: '',
    imap_host: '',
    imap_port: '993',
  });

  const connectGmail = async () => {
    setConnecting(true);
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
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(authUrl, 'Gmail OAuth', `width=${width},height=${height},left=${left},top=${top}`);

      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'gmail-connected') {
          try {
            await supabase.from('email_configurations').upsert({
              user_id: user?.id as string,
              name: event.data.email || 'Gmail',
              email: event.data.email || '',
              provider: 'gmail',
              is_connected: true,
            }, { onConflict: 'user_id' });

            setImapForm({ email: '', password: '', imap_host: '', imap_port: '993' });
            await onComplete();
            onClose();
          } catch (e) {
            console.error('Error saving Gmail config:', e);
            alert('Erreur lors de la sauvegarde');
          }
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Error connecting Gmail:', err);
      alert('Erreur lors de la connexion Gmail');
      setConnecting(false);
    }
  };

  const handleImapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const { error } = await supabase.from('email_configurations').upsert({
        user_id: user?.id as string,
        name: imapForm.email,
        email: imapForm.email,
        provider: 'smtp_imap',
        is_connected: true,
        password: imapForm.password,
        imap_host: imapForm.imap_host,
        imap_port: parseInt(imapForm.imap_port),
        imap_username: imapForm.email,
        imap_password: imapForm.password,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      setImapForm({ email: '', password: '', imap_host: '', imap_port: '993' });
      await onComplete();
      onClose();
    } catch (err) {
      console.error('Error saving IMAP config:', err);
      alert('Erreur lors de la configuration IMAP');
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#3D2817]">Ajouter un compte email</h2>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez votre fournisseur d'email</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="space-y-4">
                <button
                  type="button"
                  onClick={connectGmail}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#EF6855] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-lg font-semibold text-gray-700">
                    {connecting ? 'Connexion en cours...' : 'Connecter avec Gmail'}
                  </span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white border-2 border-gray-200 hover:border-[#EF6855] transition-all">
                      <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="16" rx="2"/>
                        <path d="M3 8l9 6 9-6"/>
                      </svg>
                      <span className="text-lg font-semibold text-gray-700">Configurer IMAP/SMTP</span>
                    </div>
                  </summary>

                  <form onSubmit={handleImapSubmit} className="mt-6 space-y-4 border-2 border-gray-200 rounded-xl p-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                      <input
                        type="email"
                        required
                        value={imapForm.email}
                        onChange={(e) => setImapForm({ ...imapForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                        placeholder="exemple@entreprise.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                      <input
                        type="password"
                        required
                        value={imapForm.password}
                        onChange={(e) => setImapForm({ ...imapForm, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Serveur IMAP</label>
                        <input
                          type="text"
                          required
                          value={imapForm.imap_host}
                          onChange={(e) => setImapForm({ ...imapForm, imap_host: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                          placeholder="imap.exemple.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                        <input
                          type="number"
                          required
                          value={imapForm.imap_port}
                          onChange={(e) => setImapForm({ ...imapForm, imap_port: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EF6855] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={connecting}
                      className="w-full bg-[#EF6855] text-white py-3 rounded-lg font-medium hover:bg-[#d55a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connecting ? 'Connexion...' : 'Connecter'}
                    </button>
                  </form>
                </details>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
