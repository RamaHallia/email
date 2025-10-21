# Solution Frontend uniquement - Pas besoin de modifier le backend!

## Option 1 : Passer l'email dans l'appel API au backend

Au lieu de modifier le backend, tu passes simplement l'email **que tu as déjà dans ton frontend** :

```typescript
// Dans ton composant qui appelle le backend
const emailAccount = accounts.find(acc => acc.id === selectedAccountId);

// Appel à ton backend
const response = await fetch('http://88.223.94.178:5000/poll-emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: emailAccount.email,  // <-- Tu passes déjà ça !
    password: emailAccount.password,
    imapServer: emailAccount.imap_host
  })
});
```

**Ton backend reçoit déjà l'email !** Il suffit juste de l'utiliser dans les INSERT.

---

## Option 2 : Insérer directement depuis le frontend (SANS backend)

Si tu veux contourner complètement le backend, tu peux insérer **directement dans Supabase** :

```typescript
import { supabase } from '../lib/supabase';

async function saveEmailToSupabase(
  emailAddress: string,  // L'email du compte
  messageId: string,
  subject: string,
  sender: string,
  body: string,
  category: 'info' | 'pub' | 'traite'
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const tableName = category === 'info' ? 'email_info'
                  : category === 'pub' ? 'email_pub'
                  : 'email_traite';

  // Insertion DIRECTE avec la colonne email
  const { data, error } = await supabase
    .from(tableName)
    .insert({
      user_id: user.id,
      message_id: messageId,
      email: emailAddress,  // <-- Le trigger trouvera email_account_id automatiquement
      subject,
      sender,
      body,
      received_date: new Date().toISOString()
    })
    .select('id, email_account_id')
    .single();

  if (error) {
    console.error('Erreur insertion:', error);
    return;
  }

  console.log(`Email sauvegardé avec email_account_id=${data.email_account_id}`);
  return data;
}

// Utilisation
await saveEmailToSupabase(
  'soumareramaba@gmail.com',  // Email du compte
  'msg-12345',
  'Sujet du mail',
  'sender@example.com',
  'Corps du mail',
  'info'
);
```

---

## Option 3 : Hybrid - Backend traite les emails, Frontend les sauvegarde

1. **Backend** récupère les emails depuis IMAP/Gmail/Outlook
2. **Backend** renvoie les emails au frontend
3. **Frontend** insère dans Supabase avec `email`

```typescript
// Appel au backend pour récupérer les emails
const response = await fetch('http://88.223.94.178:5000/poll-emails', {
  method: 'POST',
  body: JSON.stringify({
    email: 'soumareramaba@gmail.com',
    password: '...'
  })
});

const { emails } = await response.json();

// Le frontend insère dans Supabase
for (const email of emails) {
  await supabase.from('email_info').insert({
    user_id: user.id,
    message_id: email.messageId,
    email: 'soumareramaba@gmail.com',  // <-- Email du compte
    subject: email.subject,
    sender: email.sender,
    body: email.body
  });
}
```

---

## Recommandation : Option 1 (la plus simple)

Tu n'as **rien à changer** côté frontend puisque tu passes déjà `email` au backend !

Il suffit que ton backend **utilise cet email** dans ses INSERT :

```python
# Dans ton backend Python (1 seule ligne à ajouter)
email_address = request.json['email']  # Tu le reçois déjà !

# Puis dans l'INSERT
cursor.execute("""
    INSERT INTO email_info (user_id, message_id, email, subject, sender, body)
    VALUES (%s, %s, %s, %s, %s, %s)
""", (user_id, message_id, email_address, subject, sender, body))
```

**C'est tout !** Le trigger PostgreSQL fait le reste automatiquement.

---

## Pourquoi Option 1 est la meilleure ?

✅ Pas besoin de modifier le frontend
✅ Ton backend reçoit déjà l'email
✅ Une seule ligne à modifier dans le backend
✅ Le trigger PostgreSQL gère tout automatiquement
✅ Pas de duplication de logique

Tu veux que je te montre exactement où modifier dans ton code actuel ?
