import React, { useState } from 'react';
import { X } from 'lucide-react';

const TEAM = [
  { n: 'Geoffrey', e: 'glipman@gmail.com' }, { n: 'Olly', e: 'olly@thesunprogram.com' },
  { n: 'Bonna', e: 'bonnabambilla@gmail.com' }, { n: 'Maya', e: 'maya@thesunprogram.com' },
  { n: 'Hans', e: 'hansfr55@gmail.com' }, { n: 'Rahul', e: 'rahul@thesunprogram.com' },
  { n: 'Amos', e: 'amos@thesunprogram.com' }, { n: 'Helly', e: 'helly.he@thesunprogram.com' },
  { n: 'Angy', e: 'angela@thesunprogram.com' }, { n: 'Pratishtha', e: 'pratishtha@thesunprogram.com' },
  { n: 'Pratishtha (hotmail)', e: 'pratishtha_p@hotmail.com' },
];

interface CcFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const CcField: React.FC<CcFieldProps> = ({ value, onChange }) => {
  const [input, setInput] = useState('');
  const list = (value || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const setList = (arr: string[]) => onChange(Array.from(new Set(arr)).join(', '));
  const add = (raw: string) => {
    const parts = (raw || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...list];
    parts.forEach(p => { if (!next.includes(p)) next.push(p); });
    setList(next);
  };
  const remove = (em: string) => setList(list.filter(x => x !== em));
  const commit = () => { if (input.trim()) { add(input); setInput(''); } };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 w-full text-sm border border-slate-300 rounded-md p-1.5 min-h-[38px] bg-white focus-within:ring-1 focus-within:ring-brand-orange focus-within:border-brand-orange">
        {list.map(em => (
          <span key={em} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full pl-2.5 pr-1 py-0.5 text-xs text-slate-700 max-w-full">
            <span className="truncate max-w-[180px]" title={em}>{em}</span>
            <button type="button" onClick={() => remove(em)} title="Remove" className="text-slate-400 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center transition-colors shrink-0">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',' || e.key === ';') { e.preventDefault(); commit(); }
            else if (e.key === 'Backspace' && !input && list.length) { remove(list[list.length - 1]); }
          }}
          onBlur={commit}
          placeholder={list.length ? 'Add another…' : 'Cc (optional)'}
          className="flex-1 min-w-[140px] text-sm outline-none bg-transparent py-0.5 px-1"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        <span className="text-[11px] text-slate-400 mr-0.5">Quick Cc:</span>
        {TEAM.map(t => (
          <button key={t.e} type="button" onClick={() => add(t.e)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-colors">
            +{t.n}
          </button>
        ))}
      </div>
    </div>
  );
};
