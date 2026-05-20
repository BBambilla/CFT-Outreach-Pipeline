import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PILELINE_STATUSES, SponsorStatus, Sponsor } from '../types';
import { KanbanBoard } from './KanbanBoard';
import { SponsorDetailModal } from './SponsorDetailModal';

export const StudentHome: React.FC = () => {
  const { sponsors, currentUser } = useAppContext();
  const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(null);

  if (!currentUser) return null;

  const mySponsors = sponsors.filter(s => s.assignedStudentId === currentUser.id);

  const stats = {
    contacted: mySponsors.filter(s => s.status === 'Contacted').length,
    inConversation: mySponsors.filter(s => s.status === 'In Conversation').length,
    committed: mySponsors.filter(s => s.status === 'Committed').length,
  };

  const actionItems = mySponsors.filter(s => {
    return s.status === 'To Research' || 
           (s.status === 'In Conversation' && s.nextFollowupDate && new Date(s.nextFollowupDate) <= new Date());
  }).slice(0, 3); // Max 3

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Stats Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Contacted</p>
          <p className="text-2xl font-bold text-slate-800">{stats.contacted}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 font-heading">In Conversation</p>
          <p className="text-2xl font-bold text-brand-orange font-heading">{stats.inConversation}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 font-heading">Committed</p>
          <p className="text-2xl font-bold text-sdg-green font-heading">{stats.committed}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Deadline</p>
          <p className="text-2xl font-bold text-slate-800">6 Months</p>
        </div>
      </section>

      {/* Do this next - only show if there are action items */}
      {actionItems.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 font-heading">Do This Next</h2>
          <div className="flex flex-col md:flex-row gap-4">
            {actionItems.map(sponsor => {
              const isResearch = sponsor.status === 'To Research';
              return (
                <div key={sponsor.id} className={`flex-1 flex items-center justify-between p-3 rounded-lg border ${isResearch ? 'bg-brand-canary/10 border-brand-canary/40' : 'bg-brand-yellow/10 border-brand-yellow/40'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${isResearch ? 'bg-brand-canary/30 text-brand-orange' : 'bg-brand-yellow/30 text-brand-orange'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isResearch ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"}></path></svg>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold font-heading text-slate-900`}>{isResearch ? 'Incomplete: ' : 'Follow up: '} {sponsor.organization}</p>
                      <p className={`text-xs text-slate-600`}>
                        {isResearch ? 'Missing contact info.' : 'Follow-up is due.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSponsorId(sponsor.id)}
                    className={`px-3 py-1.5 text-xs font-semibold font-heading border rounded-md flex items-center transition-colors ${isResearch ? 'bg-white text-brand-orange border-brand-orange/30 hover:bg-brand-orange/5' : 'bg-brand-orange text-white border-brand-orange hover:bg-brand-orange/90 shadow-sm'}`}
                  >
                    {!isResearch && <span className="mr-1.5">✨</span>}
                    {isResearch ? 'Add Data' : 'Draft with AI'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Kanban Board */}
      <section className="flex-1 flex flex-col mb-4">
        <KanbanBoard sponsors={mySponsors} onSponsorClick={setSelectedSponsorId} />
      </section>

      {selectedSponsorId && (
        <SponsorDetailModal 
          sponsorId={selectedSponsorId} 
          onClose={() => setSelectedSponsorId(null)} 
        />
      )}
    </div>
  );
};
