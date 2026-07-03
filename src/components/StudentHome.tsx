import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES, SponsorStatus, Sponsor, SupportRequest } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { SponsorDetailModal } from './SponsorDetailModal';
import { AddLeadModal } from './AddLeadModal';
import { Plus, LifeBuoy, Info, MessageCircle } from 'lucide-react';
import { RequestSupportModal } from './RequestSupportModal';
import { supabase } from '../lib/supabase';

export const StudentHome: React.FC = () => {
  const { sponsors, currentUser, students } = useAppContext();
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchSupportRequests = async () => {
      const { data, error } = await supabase
        .from('support_requests')
        .select('*')
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setSupportRequests(data);
      }
    };
    
    fetchSupportRequests();

    const subscription = supabase.channel('my_support_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests', filter: `student_id=eq.${currentUser.id}` }, payload => {
        fetchSupportRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  if (!currentUser) return null;

  const countryStudents = students.filter(s => s.country === currentUser.country).map(s => s.id);
  const countrySponsors = sponsors.filter(s => !s.archived);
  const myArchivedSponsors = sponsors.filter(s => s.archived);

  const stats = {
    contacted: countrySponsors.filter(s => s.status === 'Contacted').length,
    inConversation: countrySponsors.filter(s => s.status === 'In Conversation').length,
    committed: countrySponsors.filter(s => s.status === 'Committed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-brand-canary">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Contacted</p>
          <p className="text-2xl font-bold text-slate-800">{stats.contacted}</p>
        </div>
        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 shadow-sm border-t-4 border-t-brand-orange">
          <p className="text-xs font-bold text-orange-600/80 uppercase tracking-widest mb-1 font-heading">In Conversation</p>
          <p className="text-2xl font-bold text-brand-orange font-heading">{stats.inConversation}</p>
        </div>
        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 shadow-sm border-t-4 border-t-sdg-green">
          <p className="text-xs font-bold text-green-700/80 uppercase tracking-widest mb-1 font-heading">Committed</p>
          <p className="text-2xl font-bold text-sdg-green font-heading">{stats.committed}</p>
        </div>
      </section>

      {/* Kanban Board */}
      <section className="mt-8 flex-1 w-full bg-slate-50 border shadow-inner overflow-x-auto border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[500px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold font-heading text-slate-800">My Pipeline</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsSupportModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <LifeBuoy size={16} />
              <span className="hidden sm:inline">Request Support</span>
            </button>
            <button 
              onClick={() => setIsAddingLead(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>New Lead</span>
            </button>
          </div>
        </div>

        {countrySponsors.length === 0 && (
          <div className="mb-6 p-6 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-brand-blue shadow-sm">
                <Info size={24} />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-1">No active leads yet</p>
              <p className="text-slate-600 font-medium">Click &quot;New Lead&quot; to add your first sponsor to the board.</p>
            </div>
          </div>
        )}

        <KanbanBoard sponsors={countrySponsors} archivedSponsors={myArchivedSponsors} onSponsorClick={setSelectedSponsorId} />
      </section>

      {/* My Support Requests */}
      <section className="mb-12">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-slate-500" />
              My Support Requests
            </h2>
          </div>
          <div className="divide-y divide-slate-200/60 max-h-[400px] overflow-y-auto">
            {supportRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                You haven't made any support requests yet.
              </div>
            ) : (
              supportRequests.map(req => (
                <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800 text-sm">{req.subject}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${req.status === 'actioned' ? 'bg-green-100 text-green-700' : 'bg-brand-yellow/20 text-yellow-700'}`}>
                        {req.status === 'actioned' ? 'Actioned' : 'Pending'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {isAddingLead && (
        <AddLeadModal onClose={() => setIsAddingLead(false)} />
      )}

      {selectedSponsorId && (
        <SponsorDetailModal 
          sponsorId={selectedSponsorId} 
          onClose={() => setSelectedSponsorId(null)} 
        />
      )}

      {isSupportModalOpen && (
        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />
      )}
    </div>
  );
};
