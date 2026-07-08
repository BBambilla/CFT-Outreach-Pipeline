import sys
content = open("src/components/StudentHome.tsx").read()
content = content.replace(
    '<section className="mb-12">',
    '<section className="mb-12" id="support-requests">'
)
open("src/components/StudentHome.tsx", "w").write(content)
