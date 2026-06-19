import fs from 'fs';

const orig = fs.readFileSync('./src/components/CoordinatorDashboard.tsx', 'utf-8');
const lines = orig.split('\n');
const topLines = lines.slice(0, 143);

const newLines = fs.readFileSync('/coord_dash_v2.tsx', 'utf-8');

fs.writeFileSync('./src/components/CoordinatorDashboard.tsx', topLines.join('\n') + '\n' + newLines);

console.log('Done joining');
