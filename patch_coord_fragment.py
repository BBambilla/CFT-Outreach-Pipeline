import sys

content = open("src/components/CoordinatorDashboard.tsx").read()

content = content.replace("      {selectedSponsorId && <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />}\n    </div>", "      {selectedSponsorId && <SponsorDetailModal sponsorId={selectedSponsorId} onClose={() => setSelectedSponsorId(null)} />}\n      {supportThreadId && (<SupportThreadModal requestId={supportThreadId} onClose={() => setSupportThreadId(null)} />)}\n    </div>")

open("src/components/CoordinatorDashboard.tsx", "w").write(content)
