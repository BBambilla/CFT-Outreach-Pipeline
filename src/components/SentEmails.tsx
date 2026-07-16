import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Search, ChevronDown, ChevronRight } from 'lucide-react';

const TEAM = [
  { n: 'Geoffrey', e: 'glipman@gmail.com' }, { n: 'Olly', e: 'olly@thesunprogram.com' },
  { n: 'Bonna', e: 'bonnabambilla@gmail.com' }, { n: 'Maya', e: 'maya@thesunprogram.com' },
  { n: 'Hans', e: 'hansfr55@gmail.com' }, { n: 'Rahul', e: 'rahul@thesunprogram.com' },
  { n: 'Amos', e: 'amos@thesunprogram.com' }, { n: 'Helly', e: 'helly.he@thesunprogram.com' },
  { n: 'Angy', e: 'angela@thesunprogram.com' }, { n: 'Pratishtha', e: 'pratishtha@thesunprogram.com' },
  { n: 'Pratishtha (hotmail)', e: 'pratishtha_p@hotmail.com' },
];

const toHtml = (t: string) => (t || '')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1155cc;">$1</a>')
  .replace(/(?<!["'])(https?:\/\/[^\s"']+)/g, '<a href="$1" style="color:#1155cc;">$1</a>')
  .replace(/\n/g, '<br>');

export const SentEmails: React.FC = () => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [current, setCurrent] = useState<any>(null);
  const [to, setTo] = useState(''); const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(''); const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);

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

  const openEditor = (m: any) => { setCurrent(m); setEditId(m.id); setTo(m.to_email || ''); setCc(m.cc || ''); setSubject(m.subject || ''); setBodyText(m.body_text || ''); };
  const addCc = (e: string) => setCc(prev => { const l = (prev || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean); if (!l.includes(e)) l.push(e); return l.join(', '); });

  const sendEdited = async () => {
    if (!to.trim() || sending) return;
    setSending(true);
    try {
      const resp = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: current.sent_by_email, fromName: current.sent_by_name, to, cc: cc || undefined, subject, body: bodyText, html: toHtml(bodyText) }) });
      if (!resp.ok) { alert('Send failed.'); setSending(false); return; }
      supabase.rpc('log_sent_email', { p_to_email: to, p_to_name: current.to_name, p_cc: cc || null, p_subject: subject, p_body_html: toHtml(bodyText), p_body_text: bodyText, p_sent_by_email: current.sent_by_email, p_sent_by_name: current.sent_by_name, p_sponsor_id: current.sponsor_id }).then(() => {}, () => {});
      setEditId(null); setSending(false); load(); alert('Sent.');
    } catch (e: any) { alert('Send failed: ' + e.message); setSending(false); }
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
              {openId === m.id && editId !== m.id && (
                <div className="px-4 pb-4 pl-11">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: m.body_html || (m.body_text || '').replace(/\n/g,'<br>') }} />
                  <button onClick={() => openEditor(m)} className="mt-3 text-xs font-bold text-white bg-brand-orange hover:opacity-90 px-3 py-1.5 rounded-md">Edit &amp; resend</button>
                </div>
              )}
              {editId === m.id && (
                <div className="px-4 pb-4 pl-11">
                  <div className="bg-white border border-brand-orange/40 rounded-lg p-3 space-y-2">
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">To</label>
                      <input value={to} onChange={e => setTo(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" /></div>
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">Cc</label>
                      <input value={cc} onChange={e => setCc(e.target.value)} placeholder="comma-separated" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
                      <div className="flex flex-wrap items-center gap-1.5 mt-1"><span className="text-[11px] text-slate-400">Quick Cc:</span>
                        {TEAM.map(t => (<button key={t.e} type="button" onClick={() => addCc(t.e)} className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors">+{t.n}</button>))}
                      </div></div>
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">Subject</label>
                      <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange font-medium" /></div>
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">Message</label>
                      <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={10} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" /></div>
                    <div className="flex items-center gap-2">
                      <button onClick={sendEdited} disabled={sending || !to.trim()} className="text-xs font-bold text-white bg-brand-orange hover:opacity-90 px-4 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50"><Send size={13} /> {sending ? 'Sending…' : 'Send'}</button>
                      <button onClick={() => setEditId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
