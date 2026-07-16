import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Search, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

export const SentEmails: React.FC = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('sent_emails').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) setEmails(data);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel('sent-emails').on('postgres_changes', { event: '*', schema: 'public', table: 'sent_emails' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = emails.filter(m => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (m.to_email||'').toLowerCase().includes(q) || (m.to_name||'').toLowerCase().includes(q) || (m.subject||'').toLowerCase().includes(q) || (m.sent_by_name||'').toLowerCase().includes(q);
  });

  const resend = async (m: any) => {
    if (!window.confirm(`Resend this exact email to ${m.to_email}?`)) return;
    setResendingId(m.id);
    try {
      const resp = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: m.sent_by_email, fromName: m.sent_by_name, to: m.to_email, subject: m.subject, body: m.body_text || m.subject, html: m.body_html, cc: m.cc || undefined })
      });
      if (resp.ok) {
        supabase.rpc('log_sent_email', { p_to_email: m.to_email, p_to_name: m.to_name, p_cc: m.cc, p_subject: m.subject, p_body_html: m.body_html, p_body_text: m.body_text, p_sent_by_email: m.sent_by_email, p_sent_by_name: m.sent_by_name, p_sponsor_id: m.sponsor_id }).then(() => {}, () => {});
        alert('Resent.');
      } else { alert('Resend failed.'); }
    } catch (e: any) { alert('Resend failed: ' + e.message); }
    setResendingId(null);
  };

  return (
    <div className="mt-8 flex-1 w-full">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
            <Send className="w-5 h-5 mr-2 text-slate-500" /> Sent Emails
            <span className="ml-3 bg-slate-200 text-slate-600 text-xs py-0.5 px-2.5 rounded-full font-bold">{emails.length}</span>
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search recipient or subject…" className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-orange w-64 max-w-full" />
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No sent emails{query ? ' match your search' : ' yet'}.</div>
          ) : filtered.map(m => (
            <div key={m.id}>
              <button onClick={() => setOpenId(openId === m.id ? null : m.id)} className="w-full text-left p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3">
                {openId === m.id ? <ChevronDown size={16} className="mt-1 text-slate-400 shrink-0" /> : <ChevronRight size={16} className="mt-1 text-slate-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm text-slate-800 truncate">{m.to_name || m.to_email}</span>
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap shrink-0">{m.created_at ? new Date(m.created_at).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 truncate">{m.subject || '(no subject)'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">to {m.to_email} · from {m.sent_by_name || m.sent_by_email}{m.cc ? ` · cc ${m.cc}` : ''}</p>
                </div>
              </button>
              {openId === m.id && (
                <div className="px-4 pb-4 pl-11">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: m.body_html || (m.body_text || '').replace(/\n/g,'<br>') }} />
                  <button onClick={() => resend(m)} disabled={resendingId === m.id} className="mt-3 text-xs font-bold text-white bg-brand-orange hover:opacity-90 px-3 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50">
                    <RefreshCw size={13} /> {resendingId === m.id ? 'Resending…' : 'Resend this email'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
