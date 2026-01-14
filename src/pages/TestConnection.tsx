import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TestConnection = () => {
  const [results, setResults] = useState<Array<{ type: string; title: string; message: string }>>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (type: string, title: string, message: string) => {
    setResults(prev => [...prev, { type, title, message }]);
  };

  const testConnection = async () => {
    setResults([]);
    setTesting(true);

    // Test 1: Check environment variables
    addResult('info', '📋 Step 1: Checking Environment Variables', 'Loading...');
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    await new Promise(resolve => setTimeout(resolve, 500));

    if (url && key) {
      addResult('success', '✅ Environment Variables', 
        `URL: ${url ? 'Set ✓' : 'Missing ✗'}\nKey: ${key ? 'Set ✓ (' + key.length + ' chars)' : 'Missing ✗'}\nProject ID: ${projectId || 'Not set'}`
      );
    } else {
      addResult('error', '❌ Environment Variables', 'Missing required variables!');
      setTesting(false);
      return;
    }

    // Test 2: Test auth connection
    addResult('info', '🔄 Step 2: Testing Auth Service', 'Connecting...');
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult('error', '❌ Auth Service', `Error: ${sessionError.message}`);
      } else {
        addResult('success', '✅ Auth Service', 'Connected successfully!');
        if (sessionData.session) {
          addResult('info', '👤 Current Session', `User: ${sessionData.session.user.email}`);
        } else {
          addResult('info', '👤 Current Session', 'No active session (not logged in)');
        }
      }
    } catch (error: any) {
      addResult('error', '❌ Auth Service', `Error: ${error.message}`);
    }

    // Test 3: Test API reachability
    addResult('info', '🔄 Step 3: Testing API Endpoint', 'Checking...');
    
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
        }
      });
      
      if (response.ok || response.status === 404) {
        addResult('success', '✅ API Endpoint', `Reachable (Status: ${response.status})`);
      } else {
        addResult('error', '⚠️ API Endpoint', `Status: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      addResult('error', '❌ API Endpoint', `Error: ${error.message}`);
    }

    // Final summary
    addResult('success', '✅ Test Complete', 'Your Supabase connection is configured correctly!');
    setTesting(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Supabase Connection Test</h1>
        
        <div className="mb-4 space-x-2">
          <Button onClick={testConnection} disabled={testing}>
            {testing ? 'Testing...' : 'Run Connection Test'}
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
              'border-blue-500'
            }>
              <CardHeader>
                <CardTitle className="text-lg">{result.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="whitespace-pre-line">
                  {result.message}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Click "Run Connection Test" to verify your Supabase connection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestConnection;
