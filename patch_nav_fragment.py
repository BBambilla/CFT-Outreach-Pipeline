import sys

content = open("src/components/Navigation.tsx").read()

content = content.replace("    </nav>\n      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}", "      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}\n    </nav>")

open("src/components/Navigation.tsx", "w").write(content)
