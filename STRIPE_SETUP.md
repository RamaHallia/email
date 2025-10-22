# Configuration Stripe pour Hall IA

## 🎯 Ce qui a été implémenté

### ✅ Base de données
- Table `subscriptions` créée dans Supabase
- Politiques RLS configurées pour la sécurité

### ✅ Composants React
- **SubscriptionModal** : Modal de paiement avec design aux couleurs de l'application
- **SubscriptionManagement** : Section de gestion d'abonnement dans le Dashboard
- **SubscriptionBlocker** : Bloqueur d'accès pour utilisateurs sans abonnement

### ✅ Edge Functions Supabase
- `create-checkout-session` : Création de session de paiement Stripe
- `create-portal-session` : Accès au portail de gestion Stripe
- `stripe-webhook` : Gestion des événements Stripe

### ✅ Intégrations Dashboard
- Onglet "Abonnement" ajouté dans le header
- Modal automatique après la première connexion email
- Blocage total si pas d'abonnement actif

---

## 🚀 Configuration Stripe (À FAIRE)

### Étape 1 : Créer un compte Stripe

1. Allez sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Créez votre compte Stripe
3. Activez votre compte (vérification d'identité nécessaire pour les paiements réels)

### Étape 2 : Récupérer les clés API

1. Connectez-vous au [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Développeurs** → **Clés API**
3. Récupérez :
   - **Clé publique** (commence par `pk_test_` ou `pk_live_`)
   - **Clé secrète** (commence par `sk_test_` ou `sk_live_`)

⚠️ **Mode Test vs Live** : Utilisez les clés `test` pour le développement, et les clés `live` pour la production.

### Étape 3 : Configurer le Webhook Stripe

1. Dans le Dashboard Stripe, allez dans **Développeurs** → **Webhooks**
2. Cliquez sur **+ Ajouter un endpoint**
3. URL du webhook : `https://VOTRE_PROJET.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquez sur **Ajouter un endpoint**
6. **Récupérez le secret de signature du webhook** (commence par `whsec_`)

### Étape 4 : Ajouter les variables d'environnement dans Supabase

1. Allez dans votre projet Supabase
2. **Paramètres** → **Edge Functions** → **Secrets**
3. Ajoutez les variables suivantes :

```bash
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
```

### Étape 5 : Déployer les Edge Functions

Depuis votre terminal, dans le dossier du projet :

```bash
# Déployer la fonction de création de checkout
npx supabase functions deploy create-checkout-session

# Déployer la fonction du portail client
npx supabase functions deploy create-portal-session

# Déployer la fonction webhook
npx supabase functions deploy stripe-webhook
```

### Étape 6 : Appliquer la migration de la base de données

```bash
# Depuis votre terminal
npx supabase db push
```

Ou manuellement dans Supabase :
1. Allez dans **Database** → **SQL Editor**
2. Exécutez le contenu du fichier : `supabase/migrations/20251022150000_create_subscriptions_table.sql`

---

## 💰 Tarification configurée

- **Plan de base** : 29€/mois (1 compte email)
- **Comptes additionnels** : 19€/compte/mois

---

## 🎨 Fonctionnement

### 1. Après la première connexion email
Un modal s'affiche automatiquement pour demander l'abonnement :
- Design aux couleurs orange/blanc de Hall IA
- Détails du plan avec calcul automatique
- Redirection vers Stripe Checkout

### 2. Onglet "Abonnement" dans le Dashboard
Accessible via le header, permet de :
- Voir le statut de l'abonnement (Actif, Annulé, En retard, etc.)
- Gérer le nombre de comptes email
- Mettre à jour le moyen de paiement
- Consulter les factures
- Annuler l'abonnement

### 3. Blocage sans abonnement
Si l'utilisateur n'a pas d'abonnement actif :
- Accès totalement bloqué au Dashboard
- Écran de verrouillage avec appel à l'action
- Obligation de souscrire pour continuer

### 4. Upgrade automatique
Quand l'utilisateur ajoute un deuxième compte email :
- Le modal s'affiche avec le nouveau prix calculé
- Mise à niveau automatique via Stripe
- Facturation prorata

---

## 🔄 Flux de paiement

1. **Utilisateur clique sur "Souscrire"**
   → Edge Function `create-checkout-session` créée
   → Redirection vers Stripe Checkout

2. **Paiement sur Stripe**
   → Stripe traite le paiement
   → Webhook `checkout.session.completed` envoyé

3. **Webhook reçu**
   → Edge Function `stripe-webhook` traite l'événement
   → Table `subscriptions` mise à jour
   → Status = `active`

4. **Retour sur l'application**
   → Utilisateur redirigé vers `/dashboard?success=true`
   → Accès débloqué

---

## 🧪 Test en mode développement

### Avec les clés de test Stripe :

1. Utilisez une carte de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future
   - CVC : N'importe quel 3 chiffres

2. Pour simuler différents scénarios :
   - Paiement réussi : `4242 4242 4242 4242`
   - Paiement échoué : `4000 0000 0000 0002`
   - Authentification 3D Secure : `4000 0025 0000 3155`

[Liste complète des cartes de test](https://stripe.com/docs/testing#cards)

---

## 📊 Gestion depuis Stripe

Dans le Dashboard Stripe, vous pouvez :
- Voir tous les abonnements actifs
- Consulter les paiements et factures
- Gérer les remboursements
- Voir les statistiques de revenus
- Exporter les données comptables

---

## ⚠️ Points importants

1. **Sécurité** : Ne jamais exposer la clé secrète côté client
2. **Webhooks** : Toujours valider la signature des webhooks
3. **Mode test** : Tester en profondeur avant de passer en production
4. **Conformité** : Activer votre compte Stripe pour accepter de vrais paiements
5. **Facturation** : Les webhooks mettent à jour automatiquement la base de données

---

## 🆘 Résolution de problèmes

### Le modal ne s'affiche pas
- Vérifiez que les Edge Functions sont bien déployées
- Vérifiez les secrets Stripe dans Supabase
- Ouvrez la console navigateur pour voir les erreurs

### Le paiement ne fonctionne pas
- Vérifiez que vous utilisez les bonnes clés (test vs live)
- Vérifiez que le webhook est bien configuré
- Consultez les logs Stripe pour voir les erreurs

### L'abonnement n'est pas activé
- Vérifiez que le webhook est correctement configuré
- Vérifiez les logs de la fonction `stripe-webhook`
- Vérifiez la table `subscriptions` dans Supabase

---

## 📝 Prochaines étapes recommandées

1. ✅ Tester en mode développement avec les clés test
2. ✅ Vérifier que tous les webhooks fonctionnent
3. ✅ Tester le cycle complet : souscription → utilisation → annulation
4. ✅ Activer le compte Stripe pour la production
5. ✅ Mettre à jour les clés avec les clés de production
6. ✅ Surveiller les premiers paiements

---

## 🎉 C'est prêt !

Votre intégration Stripe est complète et respecte parfaitement le design de Hall IA.

Tous les fichiers sont créés, il ne vous reste plus qu'à configurer Stripe et déployer les Edge Functions !

---

**Besoin d'aide ?** Consultez la [documentation Stripe](https://stripe.com/docs) ou le [support Supabase](https://supabase.com/docs/guides/functions).
