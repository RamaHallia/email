#!/bin/bash

echo "🚀 Déploiement de l'intégration Stripe pour Hall IA"
echo "=================================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI détecté${NC}"
echo ""

# Vérifier que les variables d'environnement sont configurées
echo "⚙️  Vérification des secrets Supabase..."
echo ""
echo -e "${YELLOW}Avez-vous configuré les secrets suivants dans Supabase ?${NC}"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo ""
read -p "Continuer le déploiement ? (o/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    echo -e "${RED}Déploiement annulé${NC}"
    echo ""
    echo "Pour configurer les secrets:"
    echo "1. Allez sur https://supabase.com/dashboard"
    echo "2. Sélectionnez votre projet"
    echo "3. Paramètres → Edge Functions → Secrets"
    echo "4. Ajoutez STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET"
    exit 1
fi

echo ""
echo "📦 Déploiement des Edge Functions..."
echo ""

# Déployer la fonction de création de checkout
echo "1️⃣  Déploiement de create-checkout-session..."
supabase functions deploy create-checkout-session
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ create-checkout-session déployée${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de create-checkout-session${NC}"
    exit 1
fi
echo ""

# Déployer la fonction du portail
echo "2️⃣  Déploiement de create-portal-session..."
supabase functions deploy create-portal-session
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ create-portal-session déployée${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de create-portal-session${NC}"
    exit 1
fi
echo ""

# Déployer la fonction webhook
echo "3️⃣  Déploiement de stripe-webhook..."
supabase functions deploy stripe-webhook
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ stripe-webhook déployée${NC}"
else
    echo -e "${RED}❌ Erreur lors du déploiement de stripe-webhook${NC}"
    exit 1
fi
echo ""

echo "=================================================="
echo -e "${GREEN}🎉 Toutes les Edge Functions sont déployées !${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurez le webhook dans Stripe Dashboard:"
echo "   URL: https://VOTRE_PROJET.supabase.co/functions/v1/stripe-webhook"
echo ""
echo "2. Appliquez la migration de base de données:"
echo "   npx supabase db push"
echo ""
echo "3. Testez l'intégration avec les cartes de test Stripe"
echo ""
echo "📖 Consultez STRIPE_SETUP.md pour plus de détails"
echo ""
