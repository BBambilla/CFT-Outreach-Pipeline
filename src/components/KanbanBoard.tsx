import React from 'react';
import { Sponsor, SponsorStatus, PILELINE_STATUSES } from '../types';
import { useAppContext } from '../context/AppContext';

export const KanbanBoard: React.FC<{ sponsors: Sponsor[], onSponsorClick: (id: string) => void }> = ({ sponsors, onSponsorClick }) => {
  const { updateSponsor } = useAppContext();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('sponsorId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: SponsorStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('sponsorId');
    if (id) {
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

  return (
    <div className="flex flex-1 space-x-4 overflow-x-auto pb-4 scrollbar-hide min-h-[400px]">
      {PILELINE_STATUSES.map(status => {
        const columnSponsors = sponsors.filter(s => s.status === status);
        const isDeclined = status === 'Declined / No Response';
        
        return (
          <div 
            key={status}
            className={`min-w-[200px] w-72 flex flex-col ${isDeclined ? 'opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{status.replace(' / No Response', '')}</span>
              <span className="bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {columnSponsors.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {columnSponsors.map(sponsor => (
                <div
                  key={sponsor.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, sponsor.id)}
                  onClick={() => onSponsorClick(sponsor.id)}
                  className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-t-4 cursor-pointer hover:border-slate-300 hover:shadow transition-all ${statusBorderColors[status]}`}
                >
                  <h3 className="font-semibold text-sm mb-1 text-slate-900">{sponsor.organization}</h3>
                  <p className="text-[10px] text-slate-500 mb-2 truncate">{sponsor.contactName || 'No contact specified'}</p>
                  <div className="flex items-center justify-between">
                     {sponsor.priority === 'High' && (
                       <span className="text-[10px] font-heading px-1.5 py-0.5 bg-red-50 text-code-red rounded uppercase tracking-wider">Code Red</span>
                     )}
                  </div>
                </div>
              ))}
              {columnSponsors.length === 0 && (
                <div className="text-xs text-center text-slate-400 my-4 py-8 border-2 border-dashed border-slate-200 rounded-lg">
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
