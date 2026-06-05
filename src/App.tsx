/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { StudentHome } from './components/StudentHome';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Login } from './components/Login';

const AppContent: React.FC = () => {
  const { role, currentView, isAuthenticated } = useAppContext();
  
  if (!isAuthenticated) {
    return <Login />;
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
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
