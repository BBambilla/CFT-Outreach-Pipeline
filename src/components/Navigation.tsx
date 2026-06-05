import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Layers, Presentation, Compass, Users, LogOut } from 'lucide-react';
import { Logo } from './Logo';

export const Navigation: React.FC = () => {
  const { role, setRole, currentUser, students, setCurrentUser, currentView, setCurrentView, setIsAuthenticated } = useAppContext();

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Optional: setCurrentUser can remain or be reset if you choose.
  };

  return (
    <nav className="fixed top-0 w-full bg-brand-yellow border-b border-yellow-600/30 z-50 h-16 shrink-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center">
            <div className="w-14 h-14 mr-3 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm p-1">
              <Logo className="w-full h-full" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white mr-8 font-heading drop-shadow-sm">CFT Sponsor Outreach</span>
            
            <div className="hidden sm:flex sm:space-x-4 border-l border-white/20 pl-6">
              <button 
                onClick={() => setCurrentView('pipeline')}
                className={`${currentView === 'pipeline' ? 'text-brand-orange bg-white' : 'text-white/90 hover:bg-white/20 hover:text-white'} px-3 py-2 rounded-md text-sm font-bold transition-colors`}
              >
                Pipeline
              </button>
              <button 
                onClick={() => setCurrentView('knowledgeBase')}
                className={`${currentView === 'knowledgeBase' ? 'text-brand-orange bg-white' : 'text-white/90 hover:bg-white/20 hover:text-white'} px-3 py-2 rounded-md text-sm font-bold transition-colors`}
              >
                Knowledge Base
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                {role === 'student' ? currentUser?.name : 'Coordinator'}
              </div>
              <div className="text-xs text-white/80 font-medium">
                {role === 'student' ? currentUser?.country : 'Global Overview'}
              </div>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white border border-white/30 shadow-sm">
              {role === 'coordinator' ? <Presentation size={18} /> : <Users size={18} />}
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
