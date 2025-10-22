import { useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentSuccessModal({ isOpen, onClose }: PaymentSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
        {/* Success Icon */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Paiement réussi !</h2>
            <p className="text-white/90">Votre abonnement est maintenant actif</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#EF6855] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[#3D2817] mb-1">
                    Bienvenue sur Hall IA !
                  </h3>
                  <p className="text-sm text-gray-700">
                    Vous pouvez maintenant profiter de toutes les fonctionnalités pour automatiser vos emails et gagner du temps.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full bg-[#EF6855] transition-opacity duration-300`}
                    style={{
                      opacity: i === 0 ? 1 : 0.3,
                      animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  ></div>
                ))}
              </div>
              <span>Fermeture automatique dans quelques secondes...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
