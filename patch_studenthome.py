import sys

content = open("src/components/StudentHome.tsx").read()

content = content.replace("import { RequestSupportModal } from './RequestSupportModal';", "import { RequestSupportModal } from './RequestSupportModal';\nimport { SupportThreadModal } from './SupportThreadModal';")
content = content.replace("const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);", "const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);\n  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);")

ui_old = """                  <p className=\"text-sm text-slate-700 whitespace-pre-wrap\">{req.message}</p>
                  {req.admin_response && (
                    <div className=\"mt-3 bg-brand-orange/5 border border-brand-orange/20 rounded-lg p-3 relative\">
                      <div className=\"flex justify-between items-center mb-1\">
                        <span className=\"text-xs font-semibold text-brand-orange\">Reply from {req.responded_by || 'Admin'}</span>
                        <span className=\"text-xs text-slate-500\">{new Date(req.responded_at || '').toLocaleDateString()}</span>
                      </div>
                      <p className=\"text-sm text-slate-800 whitespace-pre-wrap\">{req.admin_response}</p>
                    </div>
                  )}"""

ui_new = """                  <p className=\"text-sm text-slate-700 whitespace-pre-wrap\">{req.message}</p>
                  <button onClick={() => setSupportThreadId(req.id)} className=\"mt-3 text-xs font-bold text-brand-orange hover:underline\">
                    View &amp; Reply{req.admin_response && req.response_seen === false ? ' • New response' : ''}
                  </button>"""

content = content.replace(ui_old, ui_new)

content = content.replace("</Layout>", "  {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}\n    </Layout>")

open("src/components/StudentHome.tsx", "w").write(content)
