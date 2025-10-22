export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  currencySymbol: string;
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SKznU14zZqoQtSCqzsGj6PI',
    name: 'Classification Email 29€',
    description: "L'essentiel pour démarrer avec l'automatisation email, 1 utilisateur inclus classification intelligente des emails, réponses automatiques personnalisées et le support par email.",
    mode: 'subscription',
    price: 29.00,
    currency: 'eur',
    currencySymbol: '€'
  },
  {
    priceId: 'price_1SKzor14zZqoQtSCYomr78di',
    name: 'Utilisateurs additionnels',
    description: 'Ajoutez des membres à votre équipe: Utilisateur supplémentaire, toutes les fonctionnalités incluses,boîte email dédiée par utilisateur, gestion centralisée de l\'équipe',
    mode: 'subscription',
    price: 19.00,
    currency: 'eur',
    currencySymbol: '€'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}