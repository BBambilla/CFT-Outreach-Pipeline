import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { X, Send, MessageCircle } from 'lucide-react';

interface SupportThreadModalProps {
  requestId: string;
  onClose: () => void;
}

export const SupportThreadModal: React.FC<SupportThreadModalProps> = ({ requestId, onClose }) => {
  const { role, currentUser, authEmail } = useAppContext();
  const [req, setReq] = useState<any>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === 'coordinator';
  const senderName = isAdmin
    ? (authEmail === 'pratishtha@cft-app.local' ? 'Pratishtha Parajuli' : 'Olly Wheatcroft')
    : (currentUser?.name || 'Student');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('support_requests').select('*').eq('id', requestId).maybeSingle();
      if (active && data) setReq(data);
    };
    load();
    if (!isAdmin) supabase.rpc('mark_support_response_seen', { p_request_id: requestId }).then(() => {}, () => {});
    const ch = supabase.channel('support-thread-' + requestId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests', filter: `id=eq.${requestId}` }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const messages: Array<{ sender: string; name: string; body: string; at: string }> =
    (req?.conversation && Array.isArray(req.conversation) && req.conversation.length > 0)
      ? req.conversation
      : [
          ...(req?.message ? [{ sender: 'student', name: req.rep_name || 'Student', body: req.message, at: req.created_at }] : []),
          ...(req?.admin_response ? [{ sender: 'admin', name: req.responded_by || 'Support Team', body: req.admin_response, at: req.responded_at || req.created_at }] : []),
        ];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const { error } = await supabase.rpc('post_support_message', {
      p_request_id: requestId, p_sender: isAdmin ? 'admin' : 'student', p_name: senderName, p_body: text,
    });
    setSending(false);
    if (error) { alert('Could not send your message: ' + error.message); return; }
    setBody('');
  };

  if (!req) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-orange" />
              <h3 className="font-bold text-slate-800">{req.subject}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">{req.rep_name} • {req.country}{req.category ? ` • ${req.category}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${m.sender === 'admin' ? 'bg-brand-orange text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                <div className={`text-[10px] font-bold mb-0.5 ${m.sender === 'admin' ? 'text-white/80' : 'text-slate-400'}`}>{m.name}</div>
                <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                <div className={`text-[10px] mt-1 ${m.sender === 'admin' ? 'text-white/70' : 'text-slate-400'}`}>{m.at ? new Date(m.at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-slate-200 bg-white">
          <div className="flex items-end gap-2">
            <textarea value={body} onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={2} placeholder={isAdmin ? 'Write a response to the student…' : 'Reply to the support team…'}
              className="flex-1 resize-none border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
            <button onClick={handleSend} disabled={sending || !body.trim()}
              className="shrink-0 bg-brand-orange text-white rounded-xl px-4 py-2.5 font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
              <Send size={15} /> {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
