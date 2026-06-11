/**
 * Shared card-building functions for tournament, club, and event cards.
 * Imported by admin.html and manage-clubs.html — change here, both pages update.
 */

// ── Portal helpers ─────────────────────────────────────────────────────────

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

// ── Contact cell ──────────────────────────────────────────────────────────

function ccContact(label, name, phone, email) {
    return `<div style="padding:14px 18px; border-right:1px solid #edf0f7;">
        <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700; margin-bottom:5px;">${label}</div>
        <div style="font-weight:700; color:#09142a; font-size:0.88rem;">${name || '—'}</div>
        ${phone ? `<div style="font-size:0.76rem; color:#555; margin-top:3px;">📞 ${phone}</div>` : ''}
        ${email ? `<div style="font-size:0.76rem; margin-top:2px;"><a href="mailto:${email}" style="color:#3498db; text-decoration:none;">✉️ ${email}</a></div>` : ''}
    </div>`;
}

// ── Billing helpers ───────────────────────────────────────────────────────

function ccBillingModelLabel(m) {
    return m === 'per_team' ? 'Per Team / Season' : m === 'per_game' ? 'Per Game / Season' : 'Flat Rate';
}

function ccFormatRateTiers(tiers) {
    if (!Array.isArray(tiers) || !tiers.length) return '—';
    return tiers.map(t => `${t.age_group === 'default' ? 'Default' : t.age_group}: $${t.rate}`).join(' · ');
}

// ── Tournament card ───────────────────────────────────────────────────────

function ccBuildTournamentCard(t) {
    const dateRange  = t.from_date
        ? (t.to_date && t.to_date !== t.from_date ? `${t.from_date} → ${t.to_date}` : t.from_date)
        : 'Dates TBD';
    const tVenues    = Array.isArray(t.venues) ? t.venues : [];
    const venueCount = tVenues.length;
    const fieldCount = tVenues.reduce((s, v) => s + (Array.isArray(v.fields) ? v.fields.length : 0), 0);
    const ageGroups  = Array.isArray(t.age_groups) ? t.age_groups : [];

    const ageTable = ageGroups.length ? `
        <div style="border-top:1px solid #edf0f7;">
            <div style="padding:10px 18px 4px; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700;">Age Groups &amp; Pay Rates</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                <thead><tr style="background:#f4f6fa;">
                    <th style="padding:6px 18px; text-align:left; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Age Group</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Format</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Half</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#00c853;">Center</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#3498db;">AR</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#9b59b6;">Solo CR</th>
                </tr></thead>
                <tbody>${ageGroups.map((r, i) => `<tr style="${i % 2 === 1 ? 'background:#fafbfd;' : ''}">
                    <td style="padding:6px 18px; font-weight:600; color:#09142a;">${r.age_group || ''}</td>
                    <td style="padding:6px 12px; text-align:center; color:#555;">${r.format || '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#555;">${r.half_length ? '2×' + r.half_length + 'm' : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#00c853; font-weight:700;">${r.center ? '$' + r.center : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#3498db; font-weight:700;">${r.ar ? '$' + r.ar : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#9b59b6; font-weight:700;">${r.solo_cr ? '$' + r.solo_cr : '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : '';

    const venueChips = tVenues.length
        ? `<div style="padding:12px 18px; border-top:1px solid #edf0f7;">
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#aaa; margin-bottom:8px;">Venues on File</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${tVenues.map(v => `<span style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:4px; padding:3px 8px; font-size:0.78rem; color:#0369a1;">📍 ${v.name}</span>`).join('')}
            </div>
          </div>` : '';

    return `<div style="background:white; border:1px solid #dde3f0; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <div style="background:linear-gradient(135deg,#4a0072,#1a0030); padding:12px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-family:'Barlow Condensed',sans-serif; font-size:1rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#fff;">🏆 ${t.name || t.key}</span>
                <span style="font-size:0.78rem; color:rgba(255,255,255,0.7);">📅 ${dateRange}</span>
                ${t.club ? `<span style="font-size:0.78rem; color:rgba(255,255,255,0.6);">Hosted by: ${t.club}</span>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                ${venueCount ? `<span style="font-size:0.72rem; color:rgba(255,255,255,0.55);">${venueCount} venue${venueCount !== 1 ? 's' : ''} · ${fieldCount} field${fieldCount !== 1 ? 's' : ''}</span>` : ''}
                <span style="font-size:0.72rem; background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.85); padding:2px 10px; border-radius:12px; font-weight:700; text-transform:uppercase;">${(t.status || 'upcoming').toUpperCase()}</span>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); border-bottom:1px solid #edf0f7;">
            ${ccContact('Tournament Director', t.director, '', t.director_email)}
            ${ccContact('Event Admin', t.event_admin, t.event_admin_phone, t.event_admin_email)}
            ${ccContact('Payment Coordinator', t.payment_coordinator, t.payment_coordinator_phone, t.payment_coordinator_email)}
            ${ccContact('Assignor', t.assignor, t.assignor_phone, t.assignor_email)}
        </div>
        ${ageTable}
        <div style="padding:12px 18px; background:#fafbfd; border-top:1px solid #edf0f7; display:flex; flex-direction:column; gap:7px;">
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700; margin-bottom:4px;">Portals &amp; Links</div>
            ${buildTournamentPortalRows(t.key)}
        </div>
        ${venueChips}
    </div>`;
}

// ── Event card ────────────────────────────────────────────────────────────

function ccBuildEventCard(ev) {
    const name      = ev['Club Name'] || ev.name || '(unnamed)';
    const assignors = ev.assignors_json || [];
    const lead      = assignors.find(a => a.is_lead) || assignors[0] || null;
    const assignorName  = lead ? lead.name  : (ev.assignor || '');
    const assignorEmail = lead ? lead.email : (ev['Assignor Email'] || '');
    const assignorPhone = lead ? lead.phone : (ev['Assignor Phone'] || '');
    const dateRange = [ev.start_date, ev.end_date].filter(Boolean).join(' → ') || 'Dates TBD';
    const statusLabel = ev.enabled ? 'ACTIVE' : 'DISABLED';
    const ageGroups = Array.isArray(ev.age_groups) ? ev.age_groups : [];
    const evVenues  = Array.isArray(ev.venues) ? ev.venues : [];
    const portalUrl = ev.slug ? `https://referee-tool.com/referee-availability-form.html?event=${ev.slug}` : '';

    const ageTable = ageGroups.length ? `
        <div style="border-top:1px solid #edf0f7;">
            <div style="padding:10px 18px 4px; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700;">Age Groups &amp; Pay Rates</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                <thead><tr style="background:#f4f6fa;">
                    <th style="padding:6px 18px; text-align:left; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Age Group</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Type</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Format</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#555;">Half</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#00c853;">Center</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#3498db;">AR</th>
                    <th style="padding:6px 12px; text-align:center; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#9b59b6;">Solo CR</th>
                </tr></thead>
                <tbody>${ageGroups.map((r, i) => `<tr style="${i % 2 === 1 ? 'background:#fafbfd;' : ''}">
                    <td style="padding:6px 18px; font-weight:600; color:#09142a;">${r.age_group || ''}</td>
                    <td style="padding:6px 12px; text-align:center; color:#555;">${r.game_type || '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#555;">${r.format || '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#555;">${r.half_length ? '2×' + r.half_length + 'm' : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#00c853; font-weight:700;">${r.center ? '$' + r.center : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#3498db; font-weight:700;">${r.ar ? '$' + r.ar : '—'}</td>
                    <td style="padding:6px 12px; text-align:center; color:#9b59b6; font-weight:700;">${r.solo_cr ? '$' + r.solo_cr : '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>` : '';

    const venueChips = evVenues.length
        ? `<div style="padding:12px 18px; border-top:1px solid #edf0f7;">
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#aaa; margin-bottom:8px;">Venues on File</div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
                ${evVenues.map(v => `<span style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:4px; padding:3px 8px; font-size:0.78rem; color:#0369a1;">📍 ${v.name || v}</span>`).join('')}
            </div>
          </div>` : '';

    return `<div style="background:white; border:1px solid #dde3f0; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <div style="background:linear-gradient(135deg,#0f3460,#1a6985); padding:12px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span style="font-family:'Barlow Condensed',sans-serif; font-size:1rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#fff;">📅 ${name}</span>
                <span style="font-size:0.78rem; color:rgba(255,255,255,0.7);">📅 ${dateRange}</span>
            </div>
            <span style="font-size:0.72rem; background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.85); padding:2px 10px; border-radius:12px; font-weight:700; text-transform:uppercase;">${statusLabel}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); border-bottom:1px solid #edf0f7;">
            ${ccContact('Event Admin', ev['Club Admin'], ev['Club Admin Phone'], ev['Club Admin Email'])}
            ${ccContact('Assignor', assignorName, assignorPhone, assignorEmail)}
        </div>
        ${ageTable}
        <div style="padding:12px 18px; background:#fafbfd; border-top:1px solid #edf0f7; display:flex; flex-direction:column; gap:7px;">
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700; margin-bottom:4px;">Portals &amp; Links</div>
            ${ccPortalRow('Event Availability Form', portalUrl)}
        </div>
        ${venueChips}
    </div>`;
}

// ── Club card ─────────────────────────────────────────────────────────────
// gameStats: { total, thisWeek, unassigned, venueCount, fieldCount, lastUpload: { time, uploader } }
// billing: club_contracts row or null
// c._submit_url: override portal URL (admin.html passes Airtable's Club Game Upload field)

function ccBuildClubCard(c, rates, gameStats, billing) {
    const gs         = (gameStats && typeof gameStats === 'object') ? gameStats : {};
    const total      = gs.total      != null ? gs.total      : null;
    const thisWeek   = gs.thisWeek   != null ? gs.thisWeek   : null;
    const unassigned = gs.unassigned != null ? gs.unassigned : null;
    const venueCount = gs.venueCount != null ? gs.venueCount : 0;
    const fieldCount = gs.fieldCount != null ? gs.fieldCount : null;
    const lastUpload = gs.lastUpload || null;

    const clubName  = c['Club Name'] || c.name || '';
    const slug      = c._slug || clubName.toLowerCase().replace(/\s+/g, '-');
    const submitUrl = c._submit_url || `https://referee-tool.com/club-game-submit.html?club=${slug}`;
    const payUrl    = c.payment_portal_enabled ? `${submitUrl}&pay=portal` : '';
    const presUrl   = `https://referee-tool.com/presidents-portal.html?club=${slug}`;

    const hasRec  = rates.filter(r => !r.game_type || r.game_type === 'rec');
    const hasComp = rates.filter(r => r.game_type === 'comp');

    const rateRow = r => `<tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px 14px; font-weight:700; font-size:0.86rem; color:#09142a;">${r.age_group}</td>
        <td style="padding:6px 14px; text-align:center; color:#1a7a1a; font-weight:700;">$${r.center}</td>
        <td style="padding:6px 14px; text-align:center; color:${r.ar != null ? '#1a7a1a' : '#ccc'}; font-weight:700;">${r.ar != null ? '$' + r.ar : '—'}</td>
        <td style="padding:6px 14px; text-align:center; color:${r.solo != null ? '#1a7a1a' : '#ccc'}; font-weight:700;">${r.solo != null ? '$' + r.solo : '—'}</td>
    </tr>`;

    const rateTable = (rows, label, bg) => rows.length ? `
        <div style="flex:1; min-width:200px;">
            <div style="padding:5px 14px; font-size:0.65rem; text-transform:uppercase; letter-spacing:1px; font-weight:800; color:#fff; background:${bg};">${label}</div>
            <table style="width:100%; border-collapse:collapse; font-size:0.86rem;">
                <thead><tr style="background:#f7f8fc;">
                    <th style="text-align:left; padding:5px 14px; color:#444; font-size:0.65rem; text-transform:uppercase; border-bottom:1px solid #edf0f7;">Age</th>
                    <th style="text-align:center; padding:5px 14px; color:#444; font-size:0.65rem; text-transform:uppercase; border-bottom:1px solid #edf0f7;">Center</th>
                    <th style="text-align:center; padding:5px 14px; color:#444; font-size:0.65rem; text-transform:uppercase; border-bottom:1px solid #edf0f7;">AR</th>
                    <th style="text-align:center; padding:5px 14px; color:#444; font-size:0.65rem; text-transform:uppercase; border-bottom:1px solid #edf0f7;">Solo CR</th>
                </tr></thead>
                <tbody>${rows.map(rateRow).join('')}</tbody>
            </table>
        </div>` : '';

    const paySection = rates.length ? `
        <div style="border-top:1px solid #edf0f7;">
            <div style="padding:8px 18px 4px; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700;">Pay Rates</div>
            <div style="display:flex; flex-wrap:wrap; border-top:1px solid #edf0f7; margin-top:6px;">
                ${rateTable(hasRec, 'Rec', '#09142a')}
                ${hasComp.length ? `<div style="width:1px; background:#edf0f7;"></div>` : ''}
                ${rateTable(hasComp, 'Comp', '#7c3aed')}
            </div>
            ${clubName === 'NECONN' ? `<div style="padding:8px 18px 12px; font-size:0.78rem; color:#b45309; background:#fffbeb; border-top:1px solid #fde68a;">⚠️ NECONN policy: AR is not paid for U8 or U9-U10 games, regardless of assignment.</div>` : ''}
            ${clubName === 'East Haddam' ? `<div style="padding:8px 18px 12px; font-size:0.78rem; color:#b45309; background:#fffbeb; border-top:1px solid #fde68a;">⚠️ East Haddam policy: Only one AR (AR1) is allowed to be assigned per game.</div>` : ''}
        </div>` : '';

    const billingSection = billing
        ? `<div style="border-top:1px solid #edf0f7;">
            <div style="padding:8px 18px 4px; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700;">Billing &amp; Contracts</div>
            <div style="padding:6px 18px 10px; display:flex; flex-wrap:wrap; gap:16px; align-items:center; border-top:1px solid #edf0f7;">
                <div>
                    <div style="font-size:0.62rem; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Model</div>
                    <div style="font-weight:700; font-size:0.84rem; color:#09142a;">${ccBillingModelLabel(billing.billing_model)}</div>
                </div>
                <div>
                    <div style="font-size:0.62rem; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Rates</div>
                    <div style="font-size:0.84rem; color:#09142a;">${ccFormatRateTiers(billing.rate_tiers)}</div>
                </div>
                ${billing.billing_contact_name ? `<div>
                    <div style="font-size:0.62rem; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Billing Contact</div>
                    <div style="font-size:0.84rem; color:#09142a;">${billing.billing_contact_name}</div>
                </div>` : ''}
                ${billing.payment_terms ? `<div>
                    <div style="font-size:0.62rem; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Terms</div>
                    <div style="font-size:0.84rem; color:#09142a;">${billing.payment_terms}</div>
                </div>` : ''}
                <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
                    ${billing.contract_signed_at
                        ? `<span style="background:#dcfce7; color:#14532d; font-size:0.68rem; font-weight:700; padding:2px 9px; border-radius:10px;">✓ Signed</span>`
                        : `<span style="background:#fef3c7; color:#92400e; font-size:0.68rem; font-weight:700; padding:2px 9px; border-radius:10px;">Unsigned</span>`}
                    <a href="billing-contracts.html" style="font-size:0.74rem; background:#f0f9ff; border:1px solid #bae6fd; color:#0369a1; border-radius:6px; padding:3px 10px; text-decoration:none; font-weight:700;">💰 Manage →</a>
                </div>
            </div>
        </div>`
        : (typeof openWizardForEdit === 'function' && c.id
            ? `<div style="border-top:1px solid #edf0f7; padding:10px 18px; display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:0.82rem; color:#aaa; font-style:italic;">No billing terms set</span>
                <button onclick="openWizardForEdit(${c.id})" style="font-size:0.74rem; background:#09142a; color:#fff; border:none; padding:4px 12px; border-radius:6px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif;">Set Up Billing →</button>
            </div>`
            : '');

    const lastUploadStr = lastUpload ? (() => {
        const d = new Date(lastUpload.time);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
             + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    })() : null;

    return `<div style="background:white; border:1px solid #dde3f0; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <div style="background:#09142a; padding:12px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <span style="font-family:'Barlow Condensed',sans-serif; font-size:1rem; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#fff;">${clubName}</span>
            <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center;">
                ${thisWeek !== null ? `<span style="font-size:0.75rem; color:#aac4e0;">${thisWeek} game${thisWeek !== 1 ? 's' : ''} this week${unassigned > 0 ? ` &nbsp;·&nbsp; <span style="color:#ff8a8a; font-weight:700;">${unassigned} unassigned</span>` : ' &nbsp;·&nbsp; <span style="color:#4cdf8a;">✅ all assigned</span>'}</span>` : ''}
                <span style="font-size:0.75rem; color:#aac4e0;">${total !== null ? total + ' total &nbsp;·&nbsp; ' : ''}${venueCount} venue${venueCount !== 1 ? 's' : ''}${fieldCount !== null ? ' &nbsp;·&nbsp; ' + fieldCount + ' field' + (fieldCount !== 1 ? 's' : '') : ''}</span>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); border-bottom:1px solid #edf0f7;">
            ${ccContact('President', c.president, c['President Phone'], c['President Email'])}
            ${ccContact('Club Admin', c['Club Admin'], c['Club Admin Phone'], c['Club Admin Email'])}
            ${ccContact('Payment Coordinator', c.payment_coordinator, c.payment_coordinator_phone, c.payment_coordinator_email)}
            ${ccContact('Assignor', c.assignor, c['Assignor Phone'], c['Assignor Email'])}
        </div>
        ${paySection}
        ${billingSection}
        <div style="padding:12px 18px; background:#fafbfd; border-top:1px solid #edf0f7; display:flex; flex-direction:column; gap:7px;">
            <div style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.8px; color:#09142a; font-weight:700; margin-bottom:4px;">Portals &amp; Links</div>
            ${ccPortalRow('Club Portal', submitUrl)}
            ${ccPortalRow('Pay Portal', payUrl)}
            ${ccPortalRow('President Portal', presUrl)}
            ${lastUploadStr ? `<div style="font-size:0.78rem; margin-top:3px;">
                <span style="color:#555; font-weight:600;">Last game upload: </span>
                <span style="color:#09142a; font-weight:700;">${lastUploadStr}</span>${lastUpload.uploader ? `<span style="color:#555;"> by <strong>${lastUpload.uploader}</strong></span>` : ''}
            </div>` : `<div style="font-size:0.78rem; margin-top:3px; color:#aaa;">No upload on record</div>`}
        </div>
    </div>`;
}
