import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createCheckoutSession = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const priceId = searchParams.get('price_id');
      if (!priceId) {
        setError('Prix non spécifié');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              price_id: priceId,
              mode: 'subscription',
              success_url: `${window.location.origin}/success`,
              cancel_url: `${window.location.origin}/`,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
        }

        const { url } = await response.json();

        if (url) {
          window.location.href = url;
        } else {
          throw new Error('URL de paiement non reçue');
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'Une erreur est survenue');
        setIsLoading(false);
      }
    };

    createCheckoutSession();
  }, [user, searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#3D2817] mb-4">
            Erreur
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-[#EF6855] to-[#F9A459] rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-[#3D2817] mb-4">
          Redirection vers le paiement
        </h2>
        <p className="text-gray-600">
          Veuillez patienter pendant que nous vous redirigeons vers la page de paiement sécurisée...
        </p>
      </div>
    </div>
  );
}
