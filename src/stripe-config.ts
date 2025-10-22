export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_THYvbfAfv639yH',
    priceId: 'price_1SKznU14zZqoQtSCqzsGj6PI',
    name: 'Classification Email 29€',
    description: "L'essentiel pour démarrer avec l'automatisation email, 1 utilisateur inclus classification intelligente des emails, réponses automatiques personnalisées et le support par email.",
    price: 29.00,
    currency: 'eur',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};