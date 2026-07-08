import sys

content = open("src/components/CoordinatorDashboard.tsx").read()

old_delete = """                            <button
                              className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>"""

new_delete = """                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSupportRequest(req); }}
                              className="text-xs px-2.5 py-1 rounded-md border font-medium transition-colors bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>"""

content = content.replace(old_delete, new_delete)

open("src/components/CoordinatorDashboard.tsx", "w").write(content)
