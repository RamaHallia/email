# 🔍 Guide de vérification et test Stripe

## ✅ État actuel

### Ce qui est fonctionnel
- ✅ Table `subscriptions` créée dans Supabase
- ✅ Edge Functions déployées et actives
- ✅ Webhook répond correctement (testé)
- ✅ Frontend intégré

### Ce qui doit être configuré dans Stripe

## 📝 Étapes de configuration Stripe

### 1️⃣ Vérifier le webhook dans Stripe Dashboard (MODE TEST)

1. Allez sur [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)

2. Vérifiez si un webhook existe pour votre URL :
   ```
   https://yliurdpexhvatzkgehvy.supabase.co/functions/v1/stripe-webhook
   ```

3. Si le webhook n'existe pas, créez-le :
   - Cliquez sur **+ Ajouter un endpoint**
   - URL : `https://yliurdpexhvatzkgehvy.supabase.co/functions/v1/stripe-webhook`
   - Description : `Hall IA - Webhook des abonnements`
   - Version de l'API : `2023-10-16` (ou la dernière)

4. **IMPORTANT** : Sélectionnez UNIQUEMENT ces 5 événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Cliquez sur **Ajouter un endpoint**

6. **Récupérez le secret de signature** :
   - Dans la page du webhook, cliquez sur "Révéler" à côté de "Secret de signature"
   - Copiez la valeur (commence par `whsec_...`)

### 2️⃣ Vérifier les secrets Supabase

1. Allez dans votre projet Supabase : [https://supabase.com/dashboard/project/yliurdpexhvatzkgehvy](https://supabase.com/dashboard/project/yliurdpexhvatzkgehvy)

2. Allez dans **Settings** → **Edge Functions** → **Secrets**

3. Vérifiez que ces 2 secrets existent :
   - `STRIPE_SECRET_KEY` (commence par `sk_test_...` en mode test)
   - `STRIPE_WEBHOOK_SECRET` (commence par `whsec_...`)

4. Si un secret manque, ajoutez-le

### 3️⃣ Test complet du paiement

1. **Connectez-vous à votre application Hall IA**

2. **Configurez au moins 1 compte email** (Gmail, Outlook ou SMTP)

3. **Le modal de paiement devrait apparaître**
   - Vérifiez que le prix affiché est : **29€/mois**
   - Vérifiez que le nombre de comptes est correct

4. **Cliquez sur "Souscrire"**
   - Vous serez redirigé vers Stripe Checkout

5. **Sur la page Stripe, utilisez cette carte de test** :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future (ex: 12/25)
   - CVC : N'importe quel 3 chiffres (ex: 123)
   - Code postal : N'importe lequel (ex: 75001)

6. **Complétez le paiement**

7. **Vous serez redirigé vers l'application**
   - URL : `https://votre-app.com/dashboard?success=true`
   - Un message de succès devrait s'afficher
   - Le modal devrait se fermer automatiquement

### 4️⃣ Vérification dans la base de données

Après le paiement, vérifiez dans Supabase :

1. Allez dans **Database** → **Table Editor**
2. Ouvrez la table `subscriptions`
3. Vous devriez voir une ligne avec :
   - `user_id` : Votre ID utilisateur
   - `status` : `active`
   - `stripe_customer_id` : Commence par `cus_...`
   - `stripe_subscription_id` : Commence par `sub_...`
   - `email_accounts_count` : Le nombre de comptes configurés
   - `current_period_end` : Date de fin de période

### 5️⃣ Vérification dans Stripe Dashboard

1. Allez sur [https://dashboard.stripe.com/test/subscriptions](https://dashboard.stripe.com/test/subscriptions)
2. Vous devriez voir votre abonnement dans la liste
3. Cliquez dessus pour voir les détails
4. Vérifiez que le montant est correct : **29,00 EUR**

### 6️⃣ Tester les logs du webhook

1. Dans Stripe Dashboard, allez sur [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Cliquez sur votre webhook
3. Allez dans l'onglet **Événements envoyés**
4. Vous devriez voir l'événement `checkout.session.completed`
5. Cliquez dessus pour voir les détails
6. Vérifiez que la réponse est : `200 OK`

## 🔧 Problèmes courants

### ❌ Le modal affiche toujours "Activer l'abonnement"

**Cause** : La table `subscriptions` est vide

**Solution** :
1. Vérifiez que le webhook est configuré dans Stripe
2. Refaites un paiement de test
3. Vérifiez les logs du webhook dans Stripe

### ❌ Erreur "Signature Stripe manquante"

**Cause** : Le webhook n'envoie pas la signature

**Solution** : Normal, c'est Stripe qui envoie la signature. Ne testez pas manuellement avec curl.

### ❌ Table `subscriptions` vide après paiement

**Cause** : Le webhook ne s'exécute pas correctement

**Solution** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est bien configuré dans Supabase
2. Vérifiez les logs de la fonction `stripe-webhook` dans Supabase
3. Vérifiez les événements dans Stripe Dashboard

### ❌ Erreur lors du paiement

**Cause** : Clé Stripe incorrecte ou manquante

**Solution** :
1. Vérifiez que `STRIPE_SECRET_KEY` existe dans les secrets Supabase
2. Vérifiez que vous utilisez la clé TEST (`sk_test_...`)
3. Vérifiez que la clé est valide dans [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)

## 📊 Commandes SQL utiles

### Vérifier les abonnements dans la base
```sql
SELECT
  user_id,
  status,
  email_accounts_count,
  current_period_end,
  created_at
FROM subscriptions
ORDER BY created_at DESC;
```

### Supprimer un abonnement de test (pour retester)
```sql
DELETE FROM subscriptions WHERE user_id = 'VOTRE_USER_ID';
```

### Vérifier tous les utilisateurs et leurs abonnements
```sql
SELECT
  p.email,
  s.status,
  s.email_accounts_count,
  s.current_period_end
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id;
```

## 🎯 Checklist finale

Avant de considérer que tout fonctionne :

- [ ] Le webhook existe dans Stripe Dashboard (mode test)
- [ ] Les 5 événements sont configurés dans le webhook
- [ ] STRIPE_SECRET_KEY existe dans Supabase secrets
- [ ] STRIPE_WEBHOOK_SECRET existe dans Supabase secrets
- [ ] La table `subscriptions` existe dans Supabase
- [ ] Un paiement de test a été effectué APRÈS la création de la table
- [ ] La table `subscriptions` contient une ligne avec status = 'active'
- [ ] Le modal ne s'affiche plus après un abonnement actif
- [ ] Le Dashboard affiche l'onglet "Abonnement" avec les infos correctes

## 🎉 Une fois que tout fonctionne

Votre système de paiement est opérationnel en mode TEST !

Pour passer en PRODUCTION :
1. Activez votre compte Stripe (vérification d'identité)
2. Remplacez les clés TEST par les clés LIVE
3. Configurez un nouveau webhook en mode LIVE
4. Testez avec une vraie carte en petit montant
5. C'est parti ! 🚀
