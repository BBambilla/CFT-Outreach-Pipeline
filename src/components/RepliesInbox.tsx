import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Mail, ExternalLink, Link2, X, Archive } from 'lucide-react';

interface RepliesInboxProps { onOpenLead: (sponsorId: string) => void; }

export const RepliesInbox: React.FC<RepliesInboxProps> = ({ onOpenLead }) => {
  const { sponsors } = useAppContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unmatched' | 'attached' | 'archived'>('unmatched');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    const { data } = await supabase.from('inbound_messages').select('*').order('received_at', { ascending: false }).limit(300);
    if (data) setMessages(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('replies-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbound_messages' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Internal staff / country-forwarder mail is never a sponsor reply — hide it entirely
  const isInternal = (m: any) => (m.from_email || '').toLowerCase().endsWith('@thesunprogram.com');

  const filtered = messages.filter(m => {
    if (isInternal(m)) return false;
    if (filter === 'archived') return !!m.read;
    if (m.read) return false;
    if (filter === 'unmatched') return !m.sponsor_id;
    if (filter === 'attached') return !!m.sponsor_id;
    return true;
  });
  const unmatchedCount = messages.filter(m => !isInternal(m) && !m.sponsor_id && !m.read).length;

  const link = async (messageId: string, sponsorId: string) => {
    const { error } = await supabase.rpc('assign_inbound_message', { p_message_id: messageId, p_sponsor_id: sponsorId });
    if (error) { alert('Could not link: ' + error.message); return; }
    setLinkingId(null); setQuery(''); load();
  };

  const setArchived = async (messageId: string, archived: boolean) => {
    const { error } = await supabase.from('inbound_messages').update({ read: archived }).eq('id', messageId);
    if (error) { alert('Could not update: ' + error.message); return; }
    load();
  };

  const archiveAllShown = async () => {
    if (filtered.length === 0) return;
    if (!window.confirm(`Archive all ${filtered.length} replies shown here? You can bring them back any time from the Archived filter.`)) return;
    const { error } = await supabase.from('inbound_messages').update({ read: true }).in('id', filtered.map(m => m.id));
    if (error) { alert('Could not archive: ' + error.message); return; }
    load();
  };

  const leadOptions = query.trim()
    ? sponsors.filter(s => { const q = query.trim().toLowerCase(); return (s.organization || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q); }).slice(0, 8)
    : [];

  return (
    <div className="mt-8 flex-1 w-full">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-slate-500" /> Replies Inbox
            {unmatchedCount > 0 && <span className="ml-3 bg-amber-100 text-amber-700 text-xs py-0.5 px-2.5 rounded-full font-bold">{unmatchedCount} unmatched</span>}
          </h2>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all','unmatched','attached','archived'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{f}</button>
            ))}
          </div>
        </div>
        {filter !== 'archived' && filtered.length > 0 && (
          <div className="px-6 py-2 bg-slate-50/60 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-500">{filtered.length} shown</span>
            <button onClick={archiveAllShown} className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"><Archive size={12} /> Archive all shown</button>
          </div>
        )}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading replies…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No replies in this view.</div>
          ) : filtered.map(m => {
            const lead = m.sponsor_id ? sponsors.find(s => s.id === m.sponsor_id) : null;
            return (
              <div key={m.id} className={`p-4 transition-colors ${m.read ? 'bg-slate-50/40 opacity-70' : 'hover:bg-slate-50/70'}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 truncate">{m.from_name || m.from_email}</span>
                      <span className="text-xs text-slate-400 truncate">{m.from_email}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium mt-0.5 truncate">{m.subject || '(no subject)'}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{(m.body_text || '').slice(0, 180)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400 font-mono whitespace-nowrap">{m.received_at ? new Date(m.received_at).toLocaleDateString() : ''}</div>
                    {lead ? (
                      <button onClick={() => onOpenLead(lead.id)} className="mt-2 text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 ml-auto">{lead.organization} <ExternalLink size={11} /></button>
                    ) : (
                      <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Unmatched</span>
                    )}
                  </div>
                </div>
                {linkingId === m.id ? (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a lead by name or email…" className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
                      <button onClick={() => { setLinkingId(null); setQuery(''); }} className="p-1 text-slate-400 hover:text-slate-700"><X size={16} /></button>
                    </div>
                    {leadOptions.length > 0 && (
                      <div className="mt-1 max-h-40 overflow-y-auto">
                        {leadOptions.map(s => (
                          <button key={s.id} onClick={() => link(m.id, s.id)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-white rounded flex justify-between gap-2">
                            <span className="truncate text-slate-700">{s.organization}</span>
                            <span className="text-xs text-slate-400 truncate">{s.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    {!lead && !m.read && (
                      <button onClick={() => { setLinkingId(m.id); setQuery(m.from_email || ''); }} className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1"><Link2 size={12} /> Link to a lead</button>
                    )}
                    {m.read ? (
                      <button onClick={() => setArchived(m.id, false)} className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-2.5 py-1 rounded-md">Restore</button>
                    ) : (
                      <button onClick={() => setArchived(m.id, true)} className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1"><Archive size={12} /> Archive</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
