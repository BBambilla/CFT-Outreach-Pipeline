import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Search, ChevronDown, ChevronRight, Paperclip, X, FileText } from 'lucide-react';
import { CcField } from './CcField';

const toHtml = (t: string) => (t || '')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#1155cc;">$1</a>')
  .replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(?=\S)([^*\n]*?\S)\*/g, '<em>$1</em>')
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
  const [attachments, setAttachments] = useState<{filename: string, url?: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const openEditor = (m: any) => { setCurrent(m); setEditId(m.id); setTo(m.to_email || ''); setCc(m.cc || ''); setSubject(m.subject || ''); setBodyText(m.body_text || ''); setAttachments([]); };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const path = `outreach/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      if (error) { alert(`Failed to upload ${file.name}: ${error.message}`); continue; }
      const { data } = supabase.storage.from('attachments').getPublicUrl(path);
      setAttachments(prev => [...prev, { filename: file.name, url: data.publicUrl }]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendEdited = async () => {
    if (!to.trim() || sending) return;
    setSending(true);
    try {
      const resp = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: current.sent_by_email, fromName: current.sent_by_name, to, cc: cc || undefined, subject, body: bodyText, html: toHtml(bodyText), attachments: attachments.length > 0 ? attachments : undefined }) });
      if (!resp.ok) { alert('Send failed.'); setSending(false); return; }
      supabase.rpc('log_sent_email', { p_to_email: to, p_to_name: current.to_name, p_cc: cc || null, p_subject: subject, p_body_html: toHtml(bodyText), p_body_text: bodyText, p_sent_by_email: current.sent_by_email, p_sent_by_name: current.sent_by_name, p_sponsor_id: current.sponsor_id }).then(() => {}, () => {});
      setEditId(null); setSending(false); setAttachments([]); load(); alert('Sent.');
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
                      <CcField value={cc} onChange={setCc} />
                    </div>
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">Subject</label>
                      <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange font-medium" /></div>
                    <div><label className="text-[11px] font-bold text-slate-500 uppercase">Message</label>
                      <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={10} className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" /></div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Attachments</label>
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1.5 mt-1">
                          {attachments.map((att, i) => (
                            <span key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 shadow-sm">
                              <FileText className="w-3.5 h-3.5 text-brand-orange" />
                              <span className="truncate max-w-[150px]" title={att.filename}>{att.filename}</span>
                              <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500 ml-0.5" title="Remove"><X className="w-3.5 h-3.5" /></button>
                            </span>
                          ))}
                        </div>
                      )}
                      <input type="file" multiple ref={fileRef} style={{ display: 'none' }} onChange={handleFiles} />
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || sending} className="mt-1 text-xs font-medium text-slate-600 hover:text-brand-orange flex items-center bg-slate-100 hover:bg-orange-50 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm disabled:opacity-50">
                        <Paperclip className="w-3.5 h-3.5 mr-1.5" /> {uploading ? 'Uploading…' : 'Attach document'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={sendEdited} disabled={sending || !to.trim()} className="text-xs font-bold text-white bg-brand-orange hover:opacity-90 px-4 py-1.5 rounded-md flex items-center gap-1.5 disabled:opacity-50"><Send size={13} /> {sending ? 'Sending…' : 'Send'}</button>
                      <button onClick={() => { setEditId(null); setAttachments([]); }} className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5">Cancel</button>
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
