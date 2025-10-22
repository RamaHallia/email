/*
  # Créer la table subscriptions pour gérer les abonnements Stripe

  1. Nouvelle table
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence à auth.users)
      - `stripe_customer_id` (text, ID client Stripe)
      - `stripe_subscription_id` (text, ID abonnement Stripe)
      - `stripe_price_id` (text, ID du prix Stripe)
      - `status` (text, statut de l'abonnement: active, canceled, past_due, etc.)
      - `plan_type` (text, type de plan: 'base' ou 'additional_user')
      - `email_accounts_count` (integer, nombre de comptes email autorisés)
      - `current_period_start` (timestamptz, début de la période actuelle)
      - `current_period_end` (timestamptz, fin de la période actuelle)
      - `cancel_at_period_end` (boolean, annulation à la fin de la période)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `subscriptions`
    - Politique pour les utilisateurs de voir leur propre abonnement
*/

-- Créer la table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'incomplete',
  plan_type text NOT NULL DEFAULT 'base',
  email_accounts_count integer NOT NULL DEFAULT 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leur propre abonnement
CREATE POLICY "Users can insert own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre abonnement
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at_trigger ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();
