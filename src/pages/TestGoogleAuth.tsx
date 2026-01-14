import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TestGoogleAuth = () => {
  const [results, setResults] = useState<Array<{ type: string; title: string; message: string }>>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const addResult = (type: string, title: string, message: string) => {
    setResults(prev => [...prev, { type, title, message }]);
  };

  const testGoogleAuth = async () => {
    setResults([]);
    setTesting(true);

    // Test 1: Check environment variables
    addResult('info', '📋 Step 1: Checking Configuration', 'Loading...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!url || !key) {
      addResult('error', '❌ Configuration', 'Missing Supabase URL or API key!');
      setTesting(false);
      return;
    }

    addResult('success', '✅ Configuration', `URL: ${url}\nAPI Key: Set (${key.length} chars)`);

    // Test 2: Check if Google provider is enabled
    addResult('info', '🔄 Step 2: Testing Google OAuth', 'Attempting to initiate OAuth...');
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          skipBrowserRedirect: true, // Don't redirect, just test if it's enabled
        },
      });

      if (error) {
        if (error.message?.includes("not enabled") || error.message?.includes("provider is not enabled")) {
          addResult('error', '❌ Google OAuth Not Enabled', 
            `Error: ${error.message}\n\n` +
            `🔧 Troubleshooting Steps:\n` +
            `1. Go to https://supabase.com/dashboard\n` +
            `2. Select your project\n` +
            `3. Navigate to Authentication > Providers\n` +
            `4. Find Google and toggle it ON\n` +
            `5. Make sure you've added:\n` +
            `   - Client ID (from Google Cloud Console)\n` +
            `   - Client Secret (from Google Cloud Console)\n` +
            `6. Click SAVE\n` +
            `7. Wait 1-2 minutes for changes to propagate\n` +
            `8. Refresh this page and try again`
          );
        } else {
          addResult('error', '❌ OAuth Error', `Error: ${error.message}\n\nCode: ${error.status || 'N/A'}`);
        }
      } else {
        // If we get here with skipBrowserRedirect, it means the provider is enabled
        addResult('success', '✅ Google OAuth Enabled', 
          `Provider is configured correctly!\n\n` +
          `You can now use Google Sign-In.\n` +
          `Note: This test used skipBrowserRedirect, so no actual redirect happened.`
        );
      }
    } catch (error: any) {
      addResult('error', '❌ Unexpected Error', `Error: ${error.message || 'Unknown error'}`);
    }

    // Test 3: Check provider status via API
    addResult('info', '🔄 Step 3: Checking Provider Status', 'Querying Supabase...');
    
    try {
      // Try to get auth providers info
      const response = await fetch(`${url}/auth/v1/settings`, {
        headers: {
          'apikey': key,
        }
      });

      if (response.ok) {
        const settings = await response.json();
        addResult('info', '📊 Auth Settings', 
          `Settings retrieved successfully.\n` +
          `Check Supabase dashboard to verify Google provider is enabled.`
        );
      } else {
        addResult('warning', '⚠️ Settings Check', 
          `Could not retrieve settings (Status: ${response.status}).\n` +
          `This is normal - continue with dashboard verification.`
        );
      }
    } catch (error: any) {
      addResult('warning', '⚠️ Settings Check', `Could not check settings: ${error.message}`);
    }

    setTesting(false);
  };

  const tryGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Google OAuth Diagnostic Tool</h1>
        
        <div className="mb-4 space-x-2">
          <Button onClick={testGoogleAuth} disabled={testing}>
            {testing ? 'Testing...' : 'Test Google OAuth Configuration'}
          </Button>
          <Button onClick={tryGoogleSignIn} variant="default">
            Try Google Sign-In
          </Button>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={
              result.type === 'success' ? 'border-green-500' :
              result.type === 'error' ? 'border-red-500' :
              result.type === 'warning' ? 'border-yellow-500' :
              'border-blue-500'
            }>
              <CardHeader>
                <CardTitle className="text-lg">{result.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="whitespace-pre-line font-mono text-sm">
                  {result.message}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                Click "Test Google OAuth Configuration" to diagnose why Google Sign-In might not be working.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Common Issues:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Google provider not enabled in Supabase Dashboard</li>
                  <li>Missing Client ID or Client Secret</li>
                  <li>Changes not saved or not propagated yet</li>
                  <li>Incorrect redirect URI in Google Cloud Console</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestGoogleAuth;
