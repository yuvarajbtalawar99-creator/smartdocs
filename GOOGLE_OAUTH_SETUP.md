# Google OAuth Setup Guide

This guide will help you enable Google Sign-In for your SmartDocs Hub application.

## Step 1: Enable Google OAuth in Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project (`ulqhhmvkcsbnjakahxca`)

2. **Navigate to Authentication Settings**
   - In the left sidebar, click **Authentication**
   - Click on **Providers** tab

3. **Enable Google Provider**
   - Find **Google** in the list of providers
   - Toggle the switch to **Enable** Google provider

## Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (or select existing)**
   - Click the project dropdown at the top
   - Click **New Project**
   - Enter a project name (e.g., "SmartDocs Hub")
   - Click **Create**

3. **Enable Google+ API**
   - In the left sidebar, go to **APIs & Services** > **Library**
   - Search for "Google+ API" or "Google Identity"
   - Click on it and click **Enable**

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - Choose **External** (unless you have a Google Workspace)
     - Fill in the required information:
       - App name: SmartDocs Hub
       - User support email: your email
       - Developer contact: your email
     - Click **Save and Continue** through the steps
   - Back to Credentials, select **Web application**
   - Name it (e.g., "SmartDocs Hub Web Client")
   - **Authorized JavaScript origins:**
     - Add: `http://localhost:8080` (for development)
     - Add: `https://yourdomain.com` (for production)
   - **Authorized redirect URIs:**
     - Add: `https://ulqhhmvkcsbnjakahxca.supabase.co/auth/v1/callback`
     - This is your Supabase project's callback URL
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these next)

## Step 3: Configure Google in Supabase

1. **Back in Supabase Dashboard**
   - Go to **Authentication** > **Providers** > **Google**
   - Paste your **Client ID** (from Google Cloud Console)
   - Paste your **Client Secret** (from Google Cloud Console)
   - Click **Save**

2. **Configure Redirect URL**
   - Make sure the redirect URL in your code matches:
     - Development: `http://localhost:8080/dashboard`
     - Production: `https://yourdomain.com/dashboard`
   - This is already configured in `src/pages/Auth.tsx`

## Step 4: Test the Integration

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**
   - Navigate to `/auth` in your browser
   - Click "Continue with Google"
   - You should be redirected to Google's sign-in page
   - After signing in, you'll be redirected back to your dashboard

## Troubleshooting

### Error: "provider is not enabled"
- Make sure you've enabled Google in Supabase Dashboard > Authentication > Providers

### Error: "redirect_uri_mismatch"
- Check that your redirect URI in Google Cloud Console matches:
  - `https://ulqhhmvkcsbnjakahxca.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or typos

### Error: "invalid_client"
- Verify your Client ID and Client Secret are correct in Supabase
- Make sure you copied the entire values without extra spaces

### Not redirecting after sign-in
- Check that your redirect URL in the code matches your app URL
- For development: `http://localhost:8080/dashboard`
- Make sure your dev server is running on port 8080 (or update the port in `vite.config.ts`)

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Provider Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
