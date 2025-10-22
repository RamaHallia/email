export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SKznU14zZqoQtSCqzsGj6PI',
    name: 'Classification Email 29€',
    description: "L'essentiel pour démarrer avec l'automatisation email, 1 utilisateur inclus classification intelligente des emails, réponses automatiques personnalisées et le support par email.",
    price: 29.00,
    currency: 'EUR',
    mode: 'subscription'
  },
  {
    priceId: 'price_1SKzor14zZqoQtSCYomr78di',
    name: 'Utilisateurs additionnels',
    description: 'Ajoutez des membres à votre équipe: Utilisateur supplémentaire, toutes les fonctionnalités incluses,boîte email dédiée par utilisateur, gestion centralisée de l\'équipe',
    price: 19.00,
    currency: 'EUR',
    mode: 'subscription'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}