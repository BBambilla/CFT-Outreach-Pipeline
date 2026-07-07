/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { StudentHome } from './components/StudentHome';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Login } from './components/Login';
import { initSupabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const { role, currentView, isAuthenticated, profileStatus, retryLoadProfile, signOut } = useAppContext();
  
  if (profileStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-lg">Loading profile...</div>;
  }

  if (profileStatus === 'not-setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <h2 className="text-xl mb-4 font-semibold">Setup Required</h2>
        <p className="mb-8">This account isn't fully set up yet — please contact an administrator.</p>
        <button onClick={signOut} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2 rounded-md font-medium transition-colors">Sign out</button>
      </div>
    );
  }

  if (profileStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-700">
        <h2 className="text-xl mb-4 font-semibold text-red-600">Loading Error</h2>
        <p className="mb-8">Couldn't load your profile. Check your connection and try again.</p>
        <div className="flex gap-4">
          <button onClick={retryLoadProfile} className="bg-brand-teal hover:bg-brand-teal/90 text-white px-6 py-2 rounded-md font-medium transition-colors">Retry</button>
          <button onClick={signOut} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-2 rounded-md font-medium transition-colors">Sign out</button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && profileStatus === 'idle') {
    return <Login />;
  }

  // Prevent flash before profile resolves to found
  if (profileStatus !== 'found') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navigation />
      <main>
        {currentView === 'knowledgeBase' ? (
           <KnowledgeBase />
        ) : (
          role === 'student' ? <StudentHome /> : <CoordinatorDashboard />
        )}
      </main>
    </div>
  );
};

export default function App() { console.log("[App.tsx] rendering", new Date().toISOString());
  const [dbStatus, setDbStatus] = useState<'checking' | 'configured' | 'unconfigured'>('checking');
  
  useEffect(() => {
    initSupabase().then(success => {
      setDbStatus(success ? 'configured' : 'unconfigured');
    });
  }, []);

  if (dbStatus === 'checking') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Checking database configuration...</div>;
  }

  if (dbStatus === 'unconfigured') {
    return <div className="min-h-screen flex font-medium items-center justify-center bg-red-50 text-red-600 text-lg text-center p-8">Database not configured (Supabase URL or Anon Key is missing).</div>;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
