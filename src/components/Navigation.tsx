import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Layers, Presentation, Compass, Users, LogOut, LifeBuoy, Bell, CheckCircle2, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { RequestSupportModal } from './RequestSupportModal';
import { SupportThreadModal } from './SupportThreadModal';
import { SupportRequest } from '../types';
import { SponsorDetailModal } from './SponsorDetailModal';
import { supabase } from '../lib/supabase';

export const Navigation: React.FC = () => {
  const { role, setRole, currentUser, students, sponsors, setCurrentUser, currentView, setCurrentView, setIsAuthenticated, signOut, authEmail } = useAppContext();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const getCoordinatorName = () => {
    if (authEmail === 'pratishtha@cft-app.local') return 'Pratishtha Parajuli';
    if (authEmail === 'chapters@thesunprogram.com') return 'CRM Admin';
    if (authEmail === 'olly@cft-app.local') return 'Olly Wheatcroft';
    return 'Olly Wheatcroft';
  };
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [clearingIds, setClearingIds] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supportItems, setSupportItems] = useState<SupportRequest[]>([]);
  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);
  const inboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const load = async () => {
    const { data } = await supabase.from('support_requests').select('*');
    if (!data) return;
    setSupportItems(role === 'coordinator'
      ? data.filter((r: any) => r.status === 'pending')
      : data.filter((r: any) => r.admin_response && r.response_seen === false));
  };
  load();
  const ch = supabase.channel('nav-support')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, () => load())
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, [role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inboxRef.current && !inboxRef.current.contains(event.target as Node)) {
        setIsInboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const newResponseSponsors = sponsors
    .filter(s => s.has_new_reply)
    .sort((a, b) => new Date(b.last_reply_at || 0).getTime() - new Date(a.last_reply_at || 0).getTime());

  const totalNotifications = newResponseSponsors.length + supportItems.length;

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center">
            <button 
              className="md:hidden p-2 text-white/90 hover:bg-white/20 hover:text-white rounded-lg transition-colors mr-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="w-10 h-10 sm:w-14 sm:h-14 mr-2 sm:mr-3 flex-shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm p-1">
              <Logo className="w-full h-full" />
            </div>
            <span className="hidden sm:block font-bold text-lg sm:text-xl tracking-tight text-white mr-4 sm:mr-8 font-heading drop-shadow-sm truncate">CFT Outreach</span>
            
            <div className="hidden md:flex md:space-x-2 lg:space-x-4 border-l border-white/20 pl-4 lg:pl-6 h-full items-center">
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
                  <span>Support</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            
            <div className="relative" ref={inboxRef}>
              <button
                onClick={() => setIsInboxOpen(!isInboxOpen)}
                className="p-2 text-white/90 hover:bg-white/20 hover:text-white rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-brand-yellow">
                    {totalNotifications}
                  </span>
                )}
              </button>
              
              {isInboxOpen && (
                <div className="absolute right-0 mt-2 w-[300px] sm:w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{totalNotifications} new</span>
                  </div>

                  <div className="overflow-y-auto p-2 space-y-2 flex-1">
                    {newResponseSponsors.length === 0 ? (
                      <div className="text-sm text-center text-slate-500 py-8">No new sponsor responses</div>
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
                                 <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setClearingIds(prev => new Set(prev).add(sponsor.id));
                                    try {
                                      await supabase.rpc('clear_new_reply', { p_sponsor_id: sponsor.id });
                                    } finally {
                                      setClearingIds(prev => {
                                        const next = new Set(prev);
                                        next.delete(sponsor.id);
                                        return next;
                                      });
                                    }
                                  }}
                                  disabled={clearingIds.has(sponsor.id)}
                                  className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-1 flex items-center gap-1 rounded border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Mark as read"
                                >
                                  <CheckCircle2 size={12} />
                                  Read
                                </button>
                               </div>
                               {owner ? (
                                 <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[100px] border border-slate-200 ml-auto shrink-0">
                                    {owner.name}
                                 </span>
                               ) : <span />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {supportItems.length > 0 && (
                    <div className="border-t border-slate-100 pt-2 px-2 pb-2">
                      <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Support</div>
                      {supportItems.map(req => (
                        <div key={req.id} onClick={() => { setSupportThreadId(req.id); setIsInboxOpen(false); }}
                          className="p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-brand-orange hover:shadow-md transition-all bg-white mb-2">
                          <h3 className="font-bold text-sm text-slate-800 leading-tight">{req.subject}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{role === 'coordinator' ? `${req.rep_name} • ${req.country}` : 'New reply from the support team'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-white tracking-tight drop-shadow-sm">
                {role === 'student' ? currentUser?.name : getCoordinatorName()}
              </div>
              <div className="text-xs text-white/80 font-medium">
                {role === 'student' ? currentUser?.country : 'Admin'}
              </div>
            </div>
            
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center text-white border border-white/30 shadow-sm shrink-0">
              {role === 'coordinator' ? <Presentation size={18} /> : <Users size={18} />}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-orange border-b border-orange-600 shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button 
              onClick={() => { setCurrentView('pipeline'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-bold transition-colors ${currentView === 'pipeline' ? 'text-brand-orange bg-white' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => { setCurrentView('knowledgeBase'); setIsMobileMenuOpen(false); }}
              className={`block w-full text-left px-3 py-3 rounded-md text-base font-bold transition-colors ${currentView === 'knowledgeBase' ? 'text-brand-orange bg-white' : 'text-white/90 hover:bg-white/20 hover:text-white'}`}
            >
              Knowledge Base
            </button>
            {role === 'student' && (
              <button
                onClick={() => { setIsSupportModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full text-left flex items-center gap-2 text-white/90 hover:bg-white/20 hover:text-white px-3 py-3 rounded-md text-base font-bold transition-colors"
              >
                <LifeBuoy size={20} />
                <span>Request Support</span>
              </button>
            )}
            <div className="mt-4 pt-4 border-t border-white/20 px-3">
              <div className="text-sm font-bold text-white">
                {role === 'student' ? currentUser?.name : getCoordinatorName()}
              </div>
              <div className="text-xs text-white/80 font-medium">
                {role === 'student' ? currentUser?.country : 'Admin'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isSupportModalOpen && (
        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />
      )}
      {selectedSponsorId && (
        <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />
      )}
      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}
    </nav>
  );
};
