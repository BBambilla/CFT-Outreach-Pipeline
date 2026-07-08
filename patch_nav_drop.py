import sys

content = open("src/components/Navigation.tsx").read()

support_items_ui = """                    )}
                  </div>
                  {supportItems.length > 0 && (
                    <div className="border-t border-slate-100 pt-2 px-2 pb-2">
                      <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Support</div>
                      {supportItems.map(req => (
                        <div key={req.id} onClick={() => { setSupportThreadId(req.id); setIsInboxOpen(false); }}
                          className="p-3 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-brand-orange hover:shadow-md transition-all bg-white mb-2">
                          <h3 className="font-bold text-sm text-slate-800 leading-tight">{req.subject}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{role === 'coordinator' ? `${req.rep_name} • ${req.country}` : 'New reply from the support team'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>"""

content = content.replace("                    )}\n                  </div>\n                </div>", support_items_ui)

open("src/components/Navigation.tsx", "w").write(content)
