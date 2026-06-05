import React from 'react';
import { Sponsor, SponsorStatus, PILELINE_STATUSES } from '../types';
import { useAppContext } from '../context/AppContext';

export const KanbanBoard: React.FC<{ sponsors: Sponsor[], onSponsorClick: (id: string) => void }> = ({ sponsors, onSponsorClick }) => {
  const { updateSponsor, currentUser, students, role } = useAppContext();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('sponsorId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: SponsorStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('sponsorId');
    const sponsor = sponsors.find(s => s.id === id);
    if (id && sponsor && (role === 'coordinator' || sponsor.assignedStudentId === currentUser?.id)) {
      updateSponsor(id, { status });
    }
  };

  const statusBorderColors: Record<SponsorStatus, string> = {
    'To Research': 'border-t-slate-400',
    'Ready to Contact': 'border-t-brand-canary',
    'Contacted': 'border-t-brand-yellow',
    'In Conversation': 'border-t-brand-orange shadow-brand-orange/20 shadow-md',
    'Committed': 'border-t-sdg-green',
    'Declined / No Response': 'grayscale border-t-slate-200'
  };

  const columnTheme: Record<SponsorStatus, { colBg: string, headerText: string, badge: string }> = {
    'To Research': { 
      colBg: 'bg-slate-100 border-slate-200', 
      headerText: 'text-slate-700', 
      badge: 'bg-slate-200 text-slate-700' 
    },
    'Ready to Contact': { 
      colBg: 'bg-[#FFF9E6] border-[#FCEBA2]', 
      headerText: 'text-yellow-800', 
      badge: 'bg-yellow-200 text-yellow-800' 
    },
    'Contacted': { 
      colBg: 'bg-amber-50 border-amber-200', 
      headerText: 'text-amber-800', 
      badge: 'bg-amber-200 text-amber-900' 
    },
    'In Conversation': { 
      colBg: 'bg-orange-50 border-orange-200', 
      headerText: 'text-orange-900', 
      badge: 'bg-orange-200 text-orange-900' 
    },
    'Committed': { 
      colBg: 'bg-emerald-50 border-emerald-200', 
      headerText: 'text-emerald-800', 
      badge: 'bg-emerald-200 text-emerald-900' 
    },
    'Declined / No Response': { 
      colBg: 'bg-gray-100 border-gray-200', 
      headerText: 'text-gray-500', 
      badge: 'bg-gray-200 text-gray-600' 
    }
  };

  return (
    <div className="flex flex-1 space-x-6 overflow-x-auto pb-4 scrollbar-hide min-h-[400px]">
      {PILELINE_STATUSES.map(status => {
        const columnSponsors = sponsors.filter(s => s.status === status);
        const isDeclined = status === 'Declined / No Response';
        const theme = columnTheme[status];
        
        return (
          <div 
            key={status}
            className={`min-w-[280px] w-[320px] flex flex-col p-3 rounded-xl border ${theme.colBg} ${isDeclined ? 'opacity-60' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <span className={`text-[13px] font-bold uppercase tracking-wider ${theme.headerText}`}>{status.replace(' / No Response', '')}</span>
              <span className={`${theme.badge} text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm`}>
                {columnSponsors.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {columnSponsors.map(sponsor => {
                const isOwner = role === 'coordinator' || sponsor.assignedStudentId === currentUser?.id;
                const owner = students.find(s => s.id === sponsor.assignedStudentId);
                
                return (
                  <div
                    key={sponsor.id}
                    draggable={isOwner}
                    onDragStart={(e) => {
                      if (isOwner) handleDragStart(e, sponsor.id);
                    }}
                    onClick={() => onSponsorClick(sponsor.id)}
                    className={`p-3.5 rounded-xl block border shadow-sm border-t-4 cursor-pointer transition-all ${statusBorderColors[status]} ${isOwner ? 'bg-white hover:border-brand-orange hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-80'}`}
                  >
                    <h3 className="font-bold text-sm mb-1.5 text-slate-800 leading-tight">{sponsor.organization}</h3>
                    <p className="text-xs text-slate-500 mb-3 truncate">{sponsor.contactName || 'No contact specified'}</p>
                    <div className="flex items-center justify-between mt-auto">
                       {sponsor.priority === 'High' ? (
                         <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md uppercase tracking-wide">Code Red</span>
                       ) : <span />}
                       {owner ? (
                         <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md truncate max-w-[120px] border border-slate-200">
                            {owner.name}
                         </span>
                       ) : <span />}
                    </div>
                  </div>
                );
              })}
              {columnSponsors.length === 0 && (
                <div className={`text-sm text-center font-medium my-2 py-8 border-2 border-dashed rounded-xl opacity-60 ${theme.headerText} border-current`}>
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
