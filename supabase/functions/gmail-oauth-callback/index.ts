import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stateData = JSON.parse(atob(state));
    const { userId, redirectUrl } = stateData;

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/gmail-oauth-callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const userInfo = await userInfoResponse.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    const { data: existingConfig } = await supabase
      .from('email_configurations')
      .select('id')
      .eq('user_id', userId)
      .eq('email', userInfo.email)
      .maybeSingle();

    if (existingConfig) {
      return new Response(`
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#fff7f7; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; }
            .card { background:#ffffff; border:1px solid #fecaca; border-radius:12px; padding:28px 32px; text-align:center; box-shadow:0 10px 20px rgba(0,0,0,0.06); max-width:400px; }
            .icon { width:56px; height:56px; border-radius:9999px; background:#fef2f2; color:#dc2626; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:30px; }
            .title { font-weight:700; color:#991b1b; margin-bottom:4px; font-size:18px; }
            .subtitle { color:#475569; font-size:14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">!</div>
            <div class="title">Compte déjà existant</div>
            <div class="subtitle">Ce compte Gmail est déjà configuré. Fermeture...</div>
          </div>
          <script>
            (function() {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: 'gmail-duplicate', email: '${userInfo.email}' }, '*');
              }
              setTimeout(() => {
                try {
                  window.close();
                } catch (e) {
                  console.log('Cannot close window');
                }
              }, 2000);
            })();
          </script>
        </body>
      </html>`, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    const { data: tokenData, error: dbError } = await supabase
      .from('gmail_tokens')
      .insert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        email: userInfo.email,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const { error: configError } = await supabase
      .from('email_configurations')
      .insert({
        user_id: userId,
        name: `Gmail - ${userInfo.email}`,
        email: userInfo.email,
        provider: 'gmail',
        is_connected: true,
        gmail_token_id: tokenData.id,
        last_sync_at: new Date().toISOString()
      });

    if (configError) {
      throw new Error(`Config error: ${configError.message}`);
    }

    return new Response(`
    <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f6fff8; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; }
            .card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:28px 32px; text-align:center; box-shadow:0 10px 20px rgba(0,0,0,0.06); max-width:400px; }
            .icon { width:56px; height:56px; border-radius:9999px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:30px; }
            .title { font-weight:700; color:#065f46; margin-bottom:4px; font-size:18px; }
            .subtitle { color:#475569; font-size:14px; }
            .spinner { border: 3px solid #ecfdf5; border-top: 3px solid #059669; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 16px auto 0; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <div class="title">Connexion Gmail réussie</div>
            <div class="subtitle">Fermeture automatique...</div>
            <div class="spinner"></div>
          </div>
          <script>
            (function() {
              const email = '${userInfo.email}';
              const closeWindow = () => {
                try {
                  window.close();
                } catch (e) {
                  console.log('Cannot close window automatically');
                }
              };

              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({ type: 'gmail-connected', email: email }, '*');
                  setTimeout(closeWindow, 1000);
                } catch (e) {
                  console.error('Error sending message to opener:', e);
                  setTimeout(() => {
                    window.location.href = '${redirectUrl || supabaseUrl}';
                  }, 2000);
                }
              } else {
                setTimeout(() => {
                  window.location.href = '${redirectUrl || supabaseUrl}';
                }, 2000);
              }
            })();
          </script>
        </body>
    </html>`, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});