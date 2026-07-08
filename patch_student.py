import sys

content = open("src/components/StudentHome.tsx").read()

use_effect_seen = """  useEffect(() => {
    if (!currentUser || supportRequests.length === 0) return;
    
    let hasChanges = false;
    const unseen = supportRequests.filter(req => req.admin_response && req.response_seen === false);
    
    if (unseen.length > 0) {
      unseen.forEach(req => {
        supabase.rpc('mark_support_response_seen', { p_request_id: req.id }).then();
      });
      
      setSupportRequests(prev => prev.map(r => {
        if (r.admin_response && r.response_seen === false) {
          return { ...r, response_seen: true };
        }
        return r;
      }));
    }
  }, [supportRequests, currentUser]);

  const toggleLeadModal = () => setIsAddingLead(!isAddingLead);"""

content = content.replace("  useEffect(() => {", use_effect_seen + "\n\n  useEffect(() => {", 1)

ui_inject = """                  <p className=\"text-sm text-slate-700 whitespace-pre-wrap\">{req.message}</p>
                  {req.admin_response && (
                    <div className=\"mt-3 bg-brand-orange/5 border border-brand-orange/20 rounded-lg p-3 relative\">
                      <div className=\"flex justify-between items-center mb-1\">
                        <span className=\"text-xs font-semibold text-brand-orange\">Reply from {req.responded_by || 'Admin'}</span>
                        <span className=\"text-xs text-slate-500\">{new Date(req.responded_at || '').toLocaleDateString()}</span>
                      </div>
                      <p className=\"text-sm text-slate-800 whitespace-pre-wrap\">{req.admin_response}</p>
                    </div>
                  )}"""

content = content.replace("<p className=\"text-sm text-slate-700 whitespace-pre-wrap\">{req.message}</p>", ui_inject)

open("src/components/StudentHome.tsx", "w").write(content)
