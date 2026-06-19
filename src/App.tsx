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
  const { role, currentView, isAuthenticated, isLoading, currentUser, students } = useAppContext();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-lg">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (role === 'student' && (!currentUser || students.length === 0)) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-lg">Loading profile...</div>;
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

export default function App() {
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
    return <div className="min-h-screen flex font-medium items-center justify-center bg-red-50 text-red-600 text-lg text-center p-8">Database not configured (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY missing).</div>;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
