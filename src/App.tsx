/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { StudentHome } from './components/StudentHome';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';

const AppContent: React.FC = () => {
  const { role } = useAppContext();
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navigation />
      <main>
        {role === 'student' ? <StudentHome /> : <CoordinatorDashboard />}
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
