// Convert Census TIGERweb CT county-subdivision GeoJSON -> compact SVG paths, one per town.
// Output: ct-towns.js  ->  window.CT_TOWNS = { viewBox, towns: [{n, d, cx, cy}] }
import fs from 'fs';

const DIR = process.argv[2];
const gj = JSON.parse(fs.readFileSync(`${DIR}/ct-towns.geojson`, 'utf8'));

// ── Projection: equirectangular with cos(lat) correction. CT is small; this is plenty. ──
const LAT0 = 41.5, K = Math.cos(LAT0 * Math.PI / 180);
const proj = ([lon, lat]) => [lon * K, -lat];

// ── Douglas-Peucker ──
function dp(pts, eps) {
    if (pts.length < 3) return pts;
    let maxD = 0, idx = 0;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
    const dx = bx - ax, dy = by - ay;
    const den = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < pts.length - 1; i++) {
        const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / den;
        if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
    return [...dp(pts.slice(0, idx + 1), eps).slice(0, -1), ...dp(pts.slice(idx), eps)];
}

// A closed ring starts and ends on the same point, which makes the DP anchor line
// zero-length and collapses everything to 2 points. Split the ring at its far side first.
function simplifyRing(ring, eps) {
    let r = ring.slice();
    const [fx, fy] = r[0], [lx, ly] = r[r.length - 1];
    if (fx === lx && fy === ly) r.pop();
    if (r.length < 4) return ring;

    let far = 0, farD = -1;
    for (let i = 1; i < r.length; i++) {
        const d = (r[i][0] - r[0][0]) ** 2 + (r[i][1] - r[0][1]) ** 2;
        if (d > farD) { farD = d; far = i; }
    }
    const a = dp(r.slice(0, far + 1), eps);
    const b = dp(r.slice(far), eps);
    const out = [...a.slice(0, -1), ...b];
    out.push(out[0]);
    return out;
}

const EPS = 0.00035;   // ~30m — keeps the coastline readable, kills the noise
const MIN_RING = 0.00002; // drop slivers (tiny islands, digitizing artifacts)

function ringArea(r) {
    let a = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++)
        a += (r[j][0] * r[i][1]) - (r[i][0] * r[j][1]);
    return Math.abs(a / 2);
}

const towns = [];
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

for (const f of gj.features) {
    const name = (f.properties.BASENAME || f.properties.NAME || '').trim();
    if (!name || /not defined/i.test(name)) continue;

    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const parts = [];
    let sx = 0, sy = 0, sn = 0, best = -1, bestRing = null;

    for (const poly of polys) {
        for (let ri = 0; ri < poly.length; ri++) {
            let ring = poly[ri].map(proj);
            if (ringArea(ring) < MIN_RING) continue;
            ring = simplifyRing(ring, EPS);
            if (ring.length < 3) continue;

            const a = ringArea(ring);
            if (ri === 0 && a > best) { best = a; bestRing = ring; }

            parts.push('M' + ring.map(([x, y]) =>
                `${x.toFixed(4)},${y.toFixed(4)}`).join('L') + 'Z');

            for (const [x, y] of ring) {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
        }
    }
    if (!parts.length) continue;

    // Label anchor = centroid of the largest ring
    if (bestRing) for (const [x, y] of bestRing) { sx += x; sy += y; sn++; }
    towns.push({
        n: name,
        d: parts.join(''),
        cx: +(sx / sn).toFixed(4),
        cy: +(sy / sn).toFixed(4)
    });
}

towns.sort((a, b) => a.n.localeCompare(b.n));

const pad = 0.01;
const vb = [
    (minX - pad).toFixed(4),
    (minY - pad).toFixed(4),
    (maxX - minX + pad * 2).toFixed(4),
    (maxY - minY + pad * 2).toFixed(4)
].join(' ');

const out = `// CT town boundaries — generated from US Census TIGERweb county subdivisions.
// Equirectangular projection (cos 41.5N). Douglas-Peucker simplified.
// Regenerate with scripts/build-ct-map.mjs — do not hand-edit.
window.CT_TOWNS = ${JSON.stringify({ viewBox: vb, towns })};
`;
fs.writeFileSync(`${DIR}/ct-towns.js`, out);

console.log(`towns: ${towns.length}`);
console.log(`viewBox: ${vb}`);
console.log(`size: ${(out.length / 1024).toFixed(1)} KB`);
console.log(`sample: ${towns.slice(0, 6).map(t => t.n).join(', ')}`);
console.log(`has Putnam: ${towns.some(t => t.n === 'Putnam')}, has Vernon: ${towns.some(t => t.n === 'Vernon')}, has Killingly: ${towns.some(t => t.n === 'Killingly')}`);
