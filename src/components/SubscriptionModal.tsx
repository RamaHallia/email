import { useState, useEffect } from 'react';
import { CreditCard, Check, X, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  emailAccountsCount: number;
  isUpgrade?: boolean;
}

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: string;
  } | null;
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  prices: StripePrice[];
}

export function SubscriptionModal({ isOpen, onClose, emailAccountsCount, isUpgrade = false }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-products`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }

      const { products: fetchedProducts } = await response.json();
      setProducts(fetchedProducts);

      if (fetchedProducts.length > 0 && fetchedProducts[0].prices.length > 0) {
        setSelectedPrice(fetchedProducts[0].prices[0].id);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingProducts(false);
    }
  };

  if (!isOpen) return null;

  const selectedPriceData = products
    .flatMap(p => p.prices)
    .find(p => p.id === selectedPrice);

  const totalPrice = selectedPriceData ? (selectedPriceData.unit_amount / 100) : 29;

  const handleSubscribe = async () => {
    if (!selectedPrice) {
      setError('Veuillez sélectionner un produit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: selectedPrice,
            emailAccountsCount,
            isUpgrade,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de la session de paiement');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EF6855] to-[#F9A459] p-6 text-white relative">
          {onClose && !isUpgrade && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2.5">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">
                {isUpgrade ? 'Mettre à niveau' : 'Activer l\'abonnement'}
              </h2>
              <p className="text-sm text-white/90">
                {isUpgrade
                  ? `Ajouter ${emailAccountsCount > 1 ? emailAccountsCount - 1 : 0} compte(s) supplémentaire(s)`
                  : 'Automatisez vos emails dès maintenant'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isUpgrade && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-blue-800">
                  <div className="font-semibold mb-0.5">Compte configuré !</div>
                  <div>Activez votre abonnement pour utiliser Hall IA.</div>
                </div>
              </div>
            </div>
          )}

          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-[#EF6855]" />
            </div>
          ) : products.length === 0 ? (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-800">
                Aucun produit disponible. Veuillez contacter le support.
              </div>
            </div>
          ) : (
            <>
              {/* Product Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#3D2817] mb-3">Sélectionnez votre plan :</h4>
                <div className="space-y-3">
                  {products.map((product) => (
                    product.prices.map((price) => (
                      <button
                        key={price.id}
                        onClick={() => setSelectedPrice(price.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedPrice === price.id
                            ? 'border-[#EF6855] bg-gradient-to-br from-orange-50 to-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-bold text-[#3D2817]">
                                {product.name}
                              </h3>
                              {selectedPrice === price.id && (
                                <div className="w-5 h-5 rounded-full bg-[#EF6855] flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600">{product.description}</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-[#EF6855]">
                              {(price.unit_amount / 100).toFixed(2)}€
                            </div>
                            <div className="text-xs text-gray-600">
                              /{price.recurring?.interval || 'mois'}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  ))}
                </div>
              </div>

              {/* Features included */}
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 border border-gray-200 mb-6">
                <h4 className="text-sm font-semibold text-[#3D2817] mb-3">Inclus dans tous les plans :</h4>
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Classification intelligente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Réponses automatiques</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Filtrage des publicités</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Statistiques détaillées</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Support email</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#EF6855] to-[#F9A459] text-white py-3 rounded-lg font-semibold text-base flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {isUpgrade ? 'Mettre à niveau' : 'Souscrire'}
                </>
              )}
            </button>
            {onClose && !isUpgrade && (
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Plus tard
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Paiement sécurisé par Stripe • Annulable à tout moment
          </p>
        </div>
      </div>
    </div>
  );
}
