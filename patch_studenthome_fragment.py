import sys

content = open("src/components/StudentHome.tsx").read()

content = content.replace("      {isSupportModalOpen && (\n        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />\n      )}\n    </div>", "      {isSupportModalOpen && (\n        <RequestSupportModal onClose={() => setIsSupportModalOpen(false)} />\n      )}\n      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}\n    </div>")

open("src/components/StudentHome.tsx", "w").write(content)
