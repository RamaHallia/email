# Diagnostic du problème Stripe

## Problème
Les colonnes de `stripe_subscriptions` restent `NULL` même après un paiement réussi.

## Ce qui fonctionne
✅ Le webhook est déployé et répond (testé avec curl)
✅ Les événements sont cochés dans le dashboard Stripe
✅ Le code du webhook est correct et a une logique de sync complète
✅ L'enregistrement initial avec `status: not_started` est créé

## Ce qui ne fonctionne PAS
❌ Le webhook ne reçoit jamais les événements `invoice.payment_succeeded` depuis Stripe
❌ Ou le webhook échoue silencieusement

## Causes possibles

### 1. Le STRIPE_WEBHOOK_SECRET est incorrect
Le secret dans votre `.env` est: `whsec_sVEH1OQJtyWqgftEXtX7zM630OZ73fOa`

**À vérifier dans Stripe:**
1. Allez sur https://dashboard.stripe.com/test/webhooks
2. Cliquez sur votre webhook
3. Cliquez sur "Reveal" pour voir le secret
4. Comparez avec celui dans le `.env`
5. Si différent, mettez à jour le `.env` et redéployez

### 2. Stripe n'envoie pas l'événement
Même si les événements sont cochés, ils peuvent ne pas se déclencher si:
- Le paiement n'a pas vraiment réussi
- Le subscription n'a pas été créé dans Stripe
- Vous avez annulé le paiement avant la fin

**À vérifier:**
1. Allez sur https://dashboard.stripe.com/test/subscriptions
2. Cherchez le customer ID: `cus_TI6Yh8lpZsVwiD`
3. Vérifiez s'il y a un subscription actif
4. Si NON → le paiement n'a jamais abouti
5. Si OUI → vérifiez les logs webhook ci-dessous

### 3. Le webhook échoue
**À vérifier dans les logs Stripe:**
1. Allez sur https://dashboard.stripe.com/test/webhooks
2. Cliquez sur votre webhook
3. Cliquez sur "Tentatives" ou "Attempts"
4. Cherchez des événements récents avec des erreurs (400, 500, timeout, etc.)
5. Cliquez sur un événement pour voir les détails

## Solutions par ordre de priorité

### Solution 1: Vérifier si un subscription existe dans Stripe
```bash
# Via le dashboard Stripe
# Allez sur: https://dashboard.stripe.com/test/subscriptions
# Cherchez: cus_TI6Yh8lpZsVwiD
# Si vous ne trouvez RIEN → le paiement a été annulé avant la fin
```

### Solution 2: Envoyer un test event depuis Stripe
```bash
# Via le dashboard Stripe
1. Allez sur: https://dashboard.stripe.com/test/webhooks
2. Cliquez sur votre webhook
3. Cliquez sur "Envoyer un événement test" ou "Send test event"
4. Choisissez "invoice.payment_succeeded"
5. Cliquez "Envoyer événement de test"
6. Vérifiez si la base de données se met à jour
```

### Solution 3: Refaire un paiement test complet
```bash
# Avec la carte test Stripe
1. Utilisez un NOUVEAU compte utilisateur
2. Cliquez sur "S'abonner"
3. Utilisez la carte: 4242 4242 4242 4242
4. Date: n'importe quelle date future
5. CVC: n'importe quel 3 chiffres
6. COMPLETEZ le paiement (ne l'annulez pas)
7. Attendez 5 secondes
8. Vérifiez la base de données
```

### Solution 4: Vérifier le secret webhook
Si le secret est incorrect, Stripe rejette TOUS les webhooks en silence.

```bash
# Comparez:
# - Dans Stripe dashboard: https://dashboard.stripe.com/test/webhooks (cliquez reveal)
# - Dans votre .env: whsec_sVEH1OQJtyWqgftEXtX7zM630OZ73fOa
#
# Si différents:
# 1. Copiez le bon secret depuis Stripe
# 2. Mettez à jour le .env
# 3. Le edge function Supabase récupère automatiquement les variables
#    depuis le .env local lors du déploiement
# 4. Refaites un test de paiement
```

## Prochaines étapes

**MAINTENANT:**
1. Allez vérifier dans Stripe si un subscription existe pour `cus_TI6Yh8lpZsVwiD`
2. Vérifiez les logs webhook dans Stripe
3. Comparez le webhook secret

**Puis revenez me dire ce que vous avez trouvé!**
