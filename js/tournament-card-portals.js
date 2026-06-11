/**
 * Shared tournament portal row generator.
 * Imported by manage-clubs.html and admin.html.
 * Add or remove portal links here — both pages update automatically.
 */

function ccPortalRow(label, url) {
    if (!url) return '';
    return `<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span style="font-size:0.78rem; font-weight:600; color:#333; min-width:130px; flex-shrink:0;">${label}</span>
        <button onclick="navigator.clipboard.writeText('${url}').then(()=>{this.textContent='✅ Copied!'; setTimeout(()=>this.textContent='📋 Copy Link',1500)})"
            style="font-size:0.74rem; background:#e8f4fd; border:1px solid #3498db; color:#2980b9; border-radius:6px; padding:3px 10px; cursor:pointer; font-family:inherit; font-weight:700;">📋 Copy Link</button>
        <a href="${url}" target="_blank"
            style="font-size:0.74rem; background:#eafaf1; border:1px solid #27ae60; color:#27ae60; border-radius:6px; padding:3px 10px; text-decoration:none; font-weight:700;">↗ Open</a>
    </div>`;
}

function buildTournamentPortalRows(key) {
    const portalUrl   = `https://referee-tool.com/club-game-submit.html?tournament=${key}`;
    const scheduleUrl = `https://referee-tool.com/tournament-schedule.html?key=${key}`;
    return ccPortalRow('Tournament Portal', portalUrl)
         + ccPortalRow('Ref Schedule',      scheduleUrl);
}
