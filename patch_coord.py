import sys

content = open("src/components/CoordinatorDashboard.tsx").read()

content = content.replace(
    "import { BulkEmailTab } from './BulkEmailTab';",
    "import { BulkEmailTab } from './BulkEmailTab';\nimport { SupportThreadModal } from './SupportThreadModal';"
)

content = content.replace("  const [supportResponses, setSupportResponses] = useState<Record<string, string>>({});", "  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);")

# Remove handleSendSupportResponse
handle_send_start = "  const handleSendSupportResponse = async (id: string) => {"
handle_send_end = "  const toggleSupportRequestStatus = (id: string, currentStatus: string) => {"

start_idx = content.find(handle_send_start)
end_idx = content.find(handle_send_end)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + content[end_idx:]

# Remove the inline support response text area and display
old_ui_block = """                      {req.admin_response ? (
                        <div className=\"mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3\">
                          <div className=\"flex justify-between items-center mb-1\">
                            <span className=\"text-xs font-semibold text-brand-orange\">Response from {req.responded_by || 'Admin'}</span>
                            <span className=\"text-xs text-slate-500\">{new Date(req.responded_at || '').toLocaleDateString()}</span>
                          </div>
                          <p className=\"text-sm text-slate-800 whitespace-pre-wrap\">{req.admin_response}</p>
                          <div className=\"mt-2 text-right\">
                            <button 
                              onClick={() => setSupportResponses(prev => ({...prev, [req.id]: req.admin_response || ''}))}
                              className=\"text-xs text-slate-500 hover:text-brand-orange underline\"
                            >
                              Edit response
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {(supportResponses[req.id] !== undefined || !req.admin_response) ? (
                        <div className=\"mt-3\">
                          <textarea 
                            className=\"w-full text-sm border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-brand-orange focus:outline-none\" 
                            rows={2} 
                            placeholder=\"Type a response...\"
                            value={supportResponses[req.id] || ''}
                            onChange={(e) => setSupportResponses(prev => ({...prev, [req.id]: e.target.value}))}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <div className=\"flex justify-end mt-1\">
                            {supportResponses[req.id] !== undefined && req.admin_response && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSupportResponses(prev => { const next = {...prev}; delete next[req.id]; return next; })}}
                                className=\"bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs font-semibold mr-2 hover:bg-slate-200\"
                              >
                                Cancel
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSendSupportResponse(req.id); }}
                              disabled={!supportResponses[req.id]?.trim()}
                              className=\"bg-brand-orange text-white px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 hover:bg-orange-600\"
                            >
                              Send response
                            </button>
                          </div>
                        </div>
                      ) : null}"""

content = content.replace(old_ui_block, "")

btn_insert = """                            <button
                              onClick={(e) => { e.stopPropagation(); setSupportThreadId(req.id); }}
                              className="text-xs px-2.5 py-1 rounded-md border font-medium bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              View &amp; Reply
                            </button>
                            <button"""
content = content.replace("                            <button\n                              onClick={(e) => { e.stopPropagation(); handleDeleteSupportRequest(req); }}", btn_insert)

content = content.replace("</Layout>", "  {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}\n    </Layout>")
open("src/components/CoordinatorDashboard.tsx", "w").write(content)
