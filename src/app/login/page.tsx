'use strict';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

/** Exported function default */
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      router.push('/');
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error || 'Invalid username or password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-indigo-600">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold uppercase tracking-wider text-slate-800">
            PFMS Secure Login
          </CardTitle>
          <p className="text-sm text-slate-500">Poultry Farm Management System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Signing in…' : 'Access Dashboard'}
            </button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
