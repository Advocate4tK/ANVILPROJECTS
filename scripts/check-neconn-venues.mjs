import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const XLSX_PATH = path.resolve(__dirname, '../../../NECONN/SPRING REC/NeconnSoccerMatchesSpring2026.4.6.26.xlsx');

const wb = XLSX.readFile(XLSX_PATH);
const ws = wb.Sheets['Matches'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Fields per venue
const venueFields = {};
for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    const venue = String(r[6] || '').trim();
    const field = r[7];
    if (!venue) continue;
    if (!venueFields[venue]) venueFields[venue] = new Set();
    if (field) venueFields[venue].add(field);
}

console.log('Venues and their field numbers:');
for (const [v, fs] of Object.entries(venueFields)) {
    console.log(`  ${v}: fields [${[...fs].sort((a,b)=>a-b).join(', ')}]`);
}
