import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users2, Plus, Trash2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('team_contacts').select('*').order('sort_order');
    setContacts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const n = name.trim(), e = email.trim();
    if (!n || !e) { setMsg('Enter both a name and an email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setMsg('That email doesn’t look valid.'); return; }
    setSaving(true); setMsg('');
    const nextOrder = contacts.reduce((m, c) => Math.max(m, c.sort_order || 0), 0) + 10;
    const { error } = await supabase.from('team_contacts').insert({ name: n, email: e, sort_order: nextOrder });
    setSaving(false);
    if (error) { setMsg('Could not add: ' + error.message); return; }
    setName(''); setEmail(''); setMsg(`Added ${n}.`); load();
  };

  const remove = async (c: any) => {
    if (!window.confirm(`Remove ${c.name} (${c.email}) from Quick Cc?`)) return;
    const { error } = await supabase.from('team_contacts').delete().eq('id', c.id);
    if (error) { setMsg('Could not remove: ' + error.message); return; }
    setMsg(`Removed ${c.name}.`); load();
  };

  return (
    <div className="mt-8 flex-1 w-full max-w-3xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-base font-semibold font-heading text-slate-900 flex items-center">
            <Users2 className="w-5 h-5 mr-2 text-slate-500" /> Team &amp; Quick Cc list
          </h2>
          <p className="text-xs text-slate-500 mt-1">These people appear as one-click <b>Quick Cc</b> buttons when composing or bulk-emailing. Add or remove anyone here — no code needed.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sam" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="sam@thesunprogram.com" className="w-full text-sm border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-brand-orange" />
            </div>
            <button onClick={add} disabled={saving} className="text-sm font-bold text-white bg-brand-orange hover:opacity-90 px-4 py-2 rounded-md flex items-center gap-1.5 disabled:opacity-50"><Plus size={15} /> Add</button>
          </div>
          {msg && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">{msg}</p>}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-sm text-slate-500 text-center">Loading…</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No team contacts yet.</div>
            ) : contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                  <span className="text-sm text-slate-500 ml-2 truncate">{c.email}</span>
                </div>
                <button onClick={() => remove(c)} title="Remove" className="text-slate-400 hover:text-white hover:bg-red-500 rounded-md p-1.5 transition-colors"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
