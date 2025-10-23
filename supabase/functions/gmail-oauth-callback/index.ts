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
      const errorRedirect = `${redirectUrl}?error=duplicate&email=${encodeURIComponent(userInfo.email)}`;
      return new Response(null, {
        status: 302,
        headers: { 'Location': errorRedirect }
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

    const successRedirect = `${redirectUrl}?success=true&email=${encodeURIComponent(userInfo.email)}`;
    return new Response(null, {
      status: 302,
      headers: { 'Location': successRedirect }
    });
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    const stateData = JSON.parse(atob(new URL(req.url).searchParams.get('state') || ''));
    const errorRedirect = `${stateData.redirectUrl}?error=${encodeURIComponent(error.message)}`;
    return new Response(null, {
      status: 302,
      headers: { 'Location': errorRedirect }
    });
  }
});
