import sys

content = open("src/components/Navigation.tsx").read()

content = content.replace("import { RequestSupportModal } from './RequestSupportModal';", "import { RequestSupportModal } from './RequestSupportModal';\nimport { SupportThreadModal } from './SupportThreadModal';\nimport { SupportRequest } from '../types';")

# replace the state lines
state_old = """  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unseenSupportResponses, setUnseenSupportResponses] = useState<number>(0);
  const inboxRef = useRef<HTMLDivElement>(null);"""
state_new = """  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supportItems, setSupportItems] = useState<SupportRequest[]>([]);
  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);
  const inboxRef = useRef<HTMLDivElement>(null);"""
content = content.replace(state_old, state_new)

effect_old = """  useEffect(() => {
    if (role === 'student' && currentUser) {
      const fetchUnseen = async () => {
        const { count } = await supabase
          .from('support_requests')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', currentUser.id)
          .eq('response_seen', false)
          .not('admin_response', 'is', null);
        
        setUnseenSupportResponses(count || 0);
      };
      
      fetchUnseen();

      const subscription = supabase.channel('support_requests_nav')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests', filter: `student_id=eq.${currentUser.id}` }, payload => {
          fetchUnseen();
        })
        .subscribe();
      
      return () => { supabase.removeChannel(subscription); };
    }
  }, [role, currentUser]);"""

effect_new = """  useEffect(() => {
  const load = async () => {
    const { data } = await supabase.from('support_requests').select('*');
    if (!data) return;
    setSupportItems(role === 'coordinator'
      ? data.filter((r: any) => r.status === 'pending')
      : data.filter((r: any) => r.admin_response && r.response_seen === false));
  };
  load();
  const ch = supabase.channel('nav-support')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, () => load())
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}, [role]);"""

content = content.replace(effect_old, effect_new)

content = content.replace("const totalUnseen = newResponseSponsors.length + unseenSupportResponses;", "const totalNotifications = newResponseSponsors.length + supportItems.length;")
content = content.replace("totalUnseen > 0", "totalNotifications > 0")
content = content.replace("{totalUnseen}", "{totalNotifications}")
content = content.replace(">{totalUnseen} new<", ">{totalNotifications} new<")

unseen_ui_old = """                  {unseenSupportResponses > 0 && (
                    <div 
                      onClick={() => {
                        setIsInboxOpen(false);
                        window.location.hash = '#support-requests';
                        document.getElementById('support-requests')?.scrollIntoView({behavior: 'smooth'});
                      }}
                      className=\"p-3 bg-brand-orange/10 border-b border-brand-orange/20 cursor-pointer hover:bg-brand-orange/20 transition-colors\"
                    >
                      <div className=\"flex items-center text-brand-orange\">
                        <LifeBuoy size={16} className=\"mr-2\" />
                        <span className=\"text-sm font-bold\">You have {unseenSupportResponses} new support repl{unseenSupportResponses === 1 ? 'y' : 'ies'}!</span>
                      </div>
                    </div>
                  )}"""

content = content.replace(unseen_ui_old, "")

support_items_ui = """                    ))}
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

# Replace the closing of the dropdown
content = content.replace("                    ))}\n                  </div>\n                </div>", support_items_ui)

content = content.replace("</nav>", "</nav>\n      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}")

open("src/components/Navigation.tsx", "w").write(content)
