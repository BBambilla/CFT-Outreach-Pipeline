import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Layers, Presentation, Compass, Users, LogOut, LifeBuoy, Bell } from 'lucide-react';
import { Logo } from './Logo';
import { RequestSupportModal } from './RequestSupportModal';
import { SponsorDetailModal } from './SponsorDetailModal';

export const Navigation: React.FC = () => {
  const { role, setRole, currentUser, students, sponsors, setCurrentUser, currentView, setCurrentView, setIsAuthenticated, signOut } = useAppContext();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
  };

  const newResponseSponsors = sponsors
    .filter(s => s.has_new_reply)
    .sort((a, b) => new Date(b.last_reply_at || 0).getTime() - new Date(a.last_reply_at || 0).getTime());

  const statusBorderColors: Record<string, string> = {
    'To Research': 'border-t-slate-400',
    'Ready to Contact': 'border-t-brand-canary',
    'Contacted': 'border-t-brand-yellow',
    'In Conversation': 'border-t-brand-orange shadow-brand-orange/20 shadow-md',
    'Committed': 'border-t-sdg-green',
    'Registered / Enrolled': 'border-t-teal-500',
    'Declined': 'grayscale border-t-slate-200'
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
            
            <div className="hidden sm:flex sm:space-x-4 border-l border-white/20 pl-6 h-full items-center">
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
              {role === 'student' && (
                <button
                  onClick={() => setIsSupportModalOpen(true)}
                  className="flex items-center gap-2 text-white/90 hover:bg-white/20 hover:text-white px-3 py-2 rounded-md text-sm font-bold transition-colors ml-2"
                >
                  <LifeBuoy size={16} />
                  <span>Request Support</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            
            <div className="relative">
              <button
                onClick={() => setIsInboxOpen(!isInboxOpen)}
                className="p-2 text-white/90 hover:bg-white/20 hover:text-white rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {newResponseSponsors.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-brand-yellow">
                    {newResponseSponsors.length}
                  </span>
                )}
              </button>
              
              {isInboxOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">New Responses</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{newResponseSponsors.length} new</span>
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2 flex-1">
                    {newResponseSponsors.length === 0 ? (
                      <div className="text-sm text-center text-slate-500 py-8">No new responses</div>
                    ) : (
                      newResponseSponsors.map(sponsor => {
                        const owner = students.find(s => s.id === sponsor.assignedStudentId);
                        return (
                          <div
                            key={sponsor.id}
                            onClick={() => {
                              setSelectedSponsorId(sponsor.id);
                              setIsInboxOpen(false);
                            }}
                            className={`p-3 rounded-xl block border shadow-sm border-t-4 cursor-pointer transition-all bg-white hover:border-brand-orange hover:shadow-md ${statusBorderColors[sponsor.status] || 'border-t-slate-200'}`}
                          >
                            <h3 className="font-bold text-sm mb-1.5 text-slate-800 leading-tight">{sponsor.organization}</h3>
                            <p className="text-xs text-slate-500 mb-3 truncate">{sponsor.contactName || 'No contact specified'}</p>
                            <div className="flex items-center justify-between mt-auto gap-2">
                               <div className="flex gap-1.5 flex-wrap">
                                 <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md uppercase tracking-wide flex items-center shadow-sm">
                                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></div>
                                   Response
                                 </span>
                                 <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wide border border-slate-200">{sponsor.status}</span>
                               </div>
                               {owner ? (
                                 <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[120px] border border-slate-200 ml-auto shrink-0">
                                    {owner.name}
                                 </span>
                               ) : <span />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                {role === 'student' ? currentUser?.name : (currentUser?.name || 'Coordinator')}
              </div>
              <div className="text-xs text-white/80 font-medium">
                {role === 'student' ? currentUser?.country : (currentUser ? 'Admin' : 'Global Overview')}
              </div>
            </div>
            {role === 'student' && (
              <button
                onClick={() => setIsSupportModalOpen(true)}
                title="Request Support"
                className="md:hidden p-2 text-white/90 hover:bg-white/20 hover:text-white rounded-lg transition-colors"
              >
                <LifeBuoy size={20} />
              </button>
            )}
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
      {isSupportModalOpen && (
        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />
      )}
      {selectedSponsorId && (
        <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />
      )}
    </nav>
  );
};
