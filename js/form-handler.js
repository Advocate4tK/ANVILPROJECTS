/**
 * Form Handler for Referee Availability Form
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('availabilityForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    if (!form) {
        console.error('Form not found');
        return;
    }

    if (!airtableClient) {
        showMessage('error', 'Configuration error: Airtable client not initialized. Please check config.js');
        submitBtn.disabled = true;
        return;
    }

    // ── Live required-field gate ──────────────────────────────────────────────
    function checkFormReady() {
        const missing = [];

        const yearsEl  = document.getElementById('yearsReffing');
        const certEl   = document.getElementById('certificationLevel');
        const genderEl = document.getElementById('refereeGender');
        if (yearsEl  && yearsEl.offsetParent  !== null && !yearsEl.value)  missing.push('Years Reffing');
        if (certEl   && certEl.offsetParent   !== null && !certEl.value)   missing.push('Certification Level');
        if (genderEl && genderEl.offsetParent !== null && !genderEl.value) missing.push('Gender');
        if (!window._tournamentMode) {
            if (!document.querySelectorAll('input[name="locations"]:checked').length)  missing.push('Preferred Locations (at least one)');
            // Venmo — required if Griswold or East Haddam selected, no payment on file, and venmo method chosen
            const checkedLocs = [...document.querySelectorAll('input[name="locations"]:checked')].map(c => c.value);
            const needsPay = ['Griswold','East Haddam'].some(c => checkedLocs.includes(c));
            if (needsPay && !window._clubPayOnFile) {
                const payMethod = document.querySelector('input[name="clubPayMethod"]:checked')?.value;
                if (!payMethod || payMethod === 'venmo') {
                    const venmoVal = (document.getElementById('clubVenmo')?.value || '').trim();
                    if (!venmoVal) missing.push('Venmo handle (required for Griswold / East Haddam)');
                }
            }
        }
        if (window._tournamentMode) {
            if (!document.querySelectorAll('input[name="ageGroups"]:checked').length)  missing.push('Preferred Age Groups (at least one)');
            if (!document.getElementById('arOnly')?.value)                             missing.push('AR Only preference');
        }

        const dayRows       = document.querySelectorAll('.day-row');
        const tournSessions = document.querySelectorAll('input[name="tournament_sessions"]:checked');
        const tournWindows  = [...document.querySelectorAll('.tw-row')].filter(r => r.querySelector('select[name="tourn_arrive"]')?.value);
        if (window._tournamentMode) {
            if (!tournSessions.length && !tournWindows.length) {
                missing.push('At least one availability date or tournament time window');
            }
        } else {
            if (!dayRows.length && !tournSessions.length && !tournWindows.length) {
                missing.push('At least one availability date or tournament time window');
            } else {
                dayRows.forEach((row, i) => {
                    const n = i + 1;
                    if (!row.querySelector('input[name="availableDate[]"]')?.value) missing.push(`Day ${n}: Date`);
                    if (!row.querySelector('[name="startTime[]"]')?.value)          missing.push(`Day ${n}: Start Time`);
                    if (!row.querySelector('[name="endTime[]"]')?.value)            missing.push(`Day ${n}: End Time`);
                    if (!row.querySelector('input[name="maxGames[]"]')?.value)      missing.push(`Day ${n}: Max Games`);
                });
            }
        }

        const prompt = document.getElementById('missingFieldsPrompt');
        if (missing.length) {
            submitBtn.disabled = true;
            if (prompt) {
                prompt.style.display = 'block';
                prompt.innerHTML = '<strong>Please complete the following before submitting:</strong><br>• ' + missing.join('<br>• ');
            }
        } else {
            submitBtn.disabled = false;
            if (prompt) prompt.style.display = 'none';
        }
    }

    // Run on every input/change — catches dynamic day rows too via delegation
    form.addEventListener('change', checkFormReady);
    form.addEventListener('input',  checkFormReady);
    // Expose globally so unlockAvailability() can trigger it on section reveal
    window.checkFormReady = checkFormReady;

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = 'Submitting... <span class="spinner"></span>';

        try {
            // Update referee record with latest profile data on every submission
            if (window._foundRefId) {
                const refUpdates = {};

                // Recalculate age from DOB
                if (window._foundRefDob && typeof window.calculateAge === 'function') {
                    const currentAge = window.calculateAge(window._foundRefDob);
                    if (currentAge !== null) refUpdates['Age'] = currentAge;
                }

                // Save profile fields that live in availabilitySection (visible to all refs)
                const years  = document.getElementById('yearsReffing')?.value;
                const cert   = document.getElementById('certificationLevel')?.value;
                const gender = document.getElementById('refereeGender')?.value;
                const arOnly = document.getElementById('arOnly')?.value;
                const ageGroupsArr = getCheckboxValues('ageGroups');
                if (years)              refUpdates['Years Reffing']       = years;
                if (cert)               refUpdates['Certification Level'] = cert;
                if (gender)             refUpdates['Gender']              = gender;
                if (arOnly)             refUpdates['Position Preference'] = arOnly === 'Yes' ? 'AR Only' : '';
                if (ageGroupsArr.length) refUpdates['Age Groups Preferred'] = ageGroupsArr.join(', ');

                // Save Club Preference from location checkboxes
                // Send as array (works for Airtable multi-select); fall back to
                // comma string if the field is a plain text type.
                const locations = getCheckboxValues('locations');
                if (locations.length > 0) {
                    refUpdates['Club Preference'] = locations; // array for multi-select
                }

                // Payment preference (Griswold / East Haddam) — skip if already on file
                const needsPay = ['Griswold','East Haddam'].some(c => locations.includes(c));
                if (needsPay && !window._clubPayOnFile) {
                    const payMethod = document.querySelector('input[name="clubPayMethod"]:checked')?.value || 'venmo';
                    refUpdates['payment_method'] = payMethod;
                    if (payMethod === 'venmo') {
                        const venmo = (document.getElementById('clubVenmo')?.value || '').trim().replace(/^@/, '');
                        if (venmo) refUpdates['venmo'] = venmo;
                    }
                }

                if (Object.keys(refUpdates).length > 0) {
                    try {
                        await airtableClient.updateRecord(
                            CONFIG.AIRTABLE_TABLES.REFEREES,
                            window._foundRefId,
                            refUpdates
                        );
                    } catch(updateErr) {
                        // If array was rejected (text field instead of multi-select), retry as string
                        if (locations.length > 0) {
                            try {
                                await airtableClient.updateRecord(
                                    CONFIG.AIRTABLE_TABLES.REFEREES,
                                    window._foundRefId,
                                    { ...refUpdates, 'Club Preference': locations.join(', ') }
                                );
                            } catch(retryErr) {
                                // Non-blocking — log but don't prevent availability from saving
                                console.warn('Could not save Club Preference:', retryErr.message);
                            }
                        } else {
                            console.warn('Could not update referee profile:', updateErr.message);
                        }
                    }

                    // Dual-write venmo/payment_method to Supabase so the pay portal can read it
                    if ((refUpdates['venmo'] || refUpdates['payment_method']) && typeof supabaseClient !== 'undefined') {
                        try {
                            const email = document.getElementById('refereeEmail')?.value.trim();
                            if (email) {
                                const sbUpdates = {};
                                if (refUpdates['venmo'])           sbUpdates.venmo           = refUpdates['venmo'];
                                if (refUpdates['payment_method'])  sbUpdates.payment_method  = refUpdates['payment_method'];
                                await supabaseClient.client.from('referees').update(sbUpdates).eq('email', email);
                            }
                        } catch(sbErr) {
                            console.warn('Could not sync venmo to Supabase:', sbErr.message);
                        }
                    }
                }
            }

            const dayRows        = document.querySelectorAll('.day-row');
            const tournChecked   = [...document.querySelectorAll('input[name="tournament_sessions"]:checked')];
            const tournWindows   = [...document.querySelectorAll('.tw-row')].filter(r => r.querySelector('select[name="tourn_arrive"]')?.value);
            if (!dayRows.length && !tournChecked.length && !tournWindows.length) throw new Error('No availability dates or tournament sessions selected.');

            // Delete existing records only for the specific dates being submitted
            // (leaves other dates untouched — upsert behavior per-date)
            const firstName = document.getElementById('refereeFirstName').value.trim();
            const lastName  = document.getElementById('refereeLastName').value.trim();
            const submittedDates = Array.from(dayRows)
                .map(row => row.querySelector('input[name="availableDate[]"]').value)
                .filter(Boolean);
            if (submittedDates.length > 0) {
                const existing = await airtableClient.getUpcomingAvailability(`${firstName} ${lastName}`);
                const toDelete = existing.filter(r => submittedDates.includes(r.fields['Date'] || r.fields['date']));
                for (const rec of toDelete) {
                    await airtableClient.deleteRecord('Availability', rec.id);
                }
            }

            // Create one availability record per day
            const submissions = [];
            dayRows.forEach(row => {
                const formData = collectFormData(row);
                submissions.push(airtableClient.createAvailability(formData));
            });

            await Promise.all(submissions);

            // Save tournament session availability (session-block mode)
            const refName = `${firstName} ${lastName}`;
            if (tournChecked.length || tournWindows.length) {
                const allTKeys = [...new Set([
                    ...tournChecked.map(cb => cb.dataset.tkey),
                    ...tournWindows.map(s  => s.dataset.tkey),
                ])];
                for (const tKey of allTKeys) {
                    await supabaseClient.client.from('availability')
                        .delete()
                        .eq('Referee Name', refName)
                        .eq('tournament_key', tKey)
                        .gte('date', new Date().toISOString().split('T')[0]);
                }
                const sessionSubs = tournChecked.map(cb => airtableClient.createAvailability({
                    'Referee Name':        refName,
                    'Date':                cb.dataset.date,
                    'Start Time':          cb.dataset.start,
                    'End Time':            cb.dataset.end,
                    'Max Games':           '1',
                    'Notes':               `${cb.dataset.label} ${cb.dataset.session}`,
                    'Status':              'New',
                    'Preferred Locations': '',
                    'tournament_key':      cb.dataset.tkey,
                }));
                const windowSubs = tournWindows.map(row => {
                    const arrive    = row.querySelector('select[name="tourn_arrive"]');
                    const depart    = row.querySelector('select[name="tourn_depart"]');
                    const tkey      = arrive.dataset.tkey;
                    const date      = arrive.dataset.date;
                    const label     = arrive.dataset.label;
                    const arriveVal = arrive.value;
                    const departVal = depart?.value || '18:00';
                    const arrTxt    = arrive.options[arrive.selectedIndex]?.text || arriveVal;
                    const depTxt    = depart?.options[depart.selectedIndex]?.text || departVal;
                    return airtableClient.createAvailability({
                        'Referee Name':        refName,
                        'Date':                date,
                        'Start Time':          arriveVal,
                        'End Time':            departVal,
                        'Max Games':           '1',
                        'Notes':               `${label} — Arrive: ${arrTxt}, Leave: ${depTxt}`,
                        'Status':              'New',
                        'Preferred Locations': '',
                        'tournament_key':      tkey,
                    });
                });
                await Promise.all([...sessionSubs, ...windowSubs]);
            }

            // Send confirmation email (non-blocking — availability already saved)
            try {
                console.log('[EmailJS] emailReady:', emailReady(), '| SERVICE_ID:', CONFIG?.EMAILJS?.SERVICE_ID, '| TEMPLATE_ID:', CONFIG?.EMAILJS?.TEMPLATE_ID, '| PUBLIC_KEY:', CONFIG?.EMAILJS?.PUBLIC_KEY);
                await sendConfirmationEmail();
                console.log('[EmailJS] Confirmation email sent OK');
            } catch(emailErr) {
                console.error('[EmailJS] Confirmation email FAILED:', emailErr);
            }

            // Send parent/guardian email if referee is under 18
            try {
                await sendParentEmail();
                console.log('[EmailJS] Parent email sent OK');
            } catch(parentErr) {
                console.error('[EmailJS] Parent email FAILED:', parentErr);
            }

            // Store session so returning to the form skips name/email step
            sessionStorage.setItem('refSession', JSON.stringify({
                firstName: document.getElementById('refereeFirstName').value.trim(),
                lastName:  document.getElementById('refereeLastName').value.trim(),
                email:     document.getElementById('refereeEmail').value.trim()
            }));
            window.location.href = 'submitted.html';

        } catch (error) {
            console.error('Submission error:', error);
            showMessage('error', `Failed to submit form: ${error.message}. Please try again or contact your assignor.`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    /**
     * Collect form data for a given day row
     */
    function collectFormData(dayRow) {
        const firstName = document.getElementById('refereeFirstName').value.trim();
        const lastName  = document.getElementById('refereeLastName').value.trim();

        const locations = Array.from(document.querySelectorAll('input[name="locations"]:checked')).map(cb => cb.value);
        const formData = {
            'Referee Name':       `${firstName} ${lastName}`,
            'Date':               dayRow.querySelector('input[name="availableDate[]"]').value,
            'Start Time':         dayRow.querySelector('[name="startTime[]"]').value,
            'End Time':           dayRow.querySelector('[name="endTime[]"]').value,
            'Max Games':          dayRow.querySelector('input[name="maxGames[]"]').value || '1',
            'Notes':              document.getElementById('notes').value.trim(),
            'Status':             'New',
            'Preferred Locations': locations.join(', ')
        };

        return formData;
    }

    /**
     * Get selected checkbox values
     */
    function getCheckboxValues(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * Validate form data
     */
    function validateForm() {
        const yearsVEl  = document.getElementById('yearsReffing');
        const certVEl   = document.getElementById('certificationLevel');
        const genderVEl = document.getElementById('refereeGender');
        if (yearsVEl  && yearsVEl.offsetParent  !== null && !yearsVEl.value) {
            showMessage('error', 'Please select your years reffing.');
            yearsVEl.focus();
            return false;
        }
        if (certVEl   && certVEl.offsetParent   !== null && !certVEl.value) {
            showMessage('error', 'Please select your certification level.');
            certVEl.focus();
            return false;
        }
        if (genderVEl && genderVEl.offsetParent !== null && !genderVEl.value) {
            showMessage('error', 'Please select your gender.');
            genderVEl.focus();
            return false;
        }

        if (!window._tournamentMode) {
            const locations = getCheckboxValues('locations');
            if (locations.length === 0) {
                showMessage('error', 'Please select at least one preferred location.');
                return false;
            }
            // Venmo required for Griswold or East Haddam
            const needsPay = ['Griswold','East Haddam'].some(c => locations.includes(c));
            if (needsPay && !window._clubPayOnFile) {
                const payMethod = document.querySelector('input[name="clubPayMethod"]:checked')?.value;
                if (!payMethod || payMethod === 'venmo') {
                    const venmoVal = (document.getElementById('clubVenmo')?.value || '').trim();
                    if (!venmoVal) {
                        showMessage('error', 'Please enter your Venmo handle for payment.');
                        document.getElementById('clubVenmo')?.focus();
                        return false;
                    }
                }
            }
        }

        if (window._tournamentMode) {
            const ageGroups = getCheckboxValues('ageGroups');
            if (ageGroups.length === 0) {
                showMessage('error', 'Please select at least one preferred age group.');
                return false;
            }
            const arOnly = document.getElementById('arOnly').value;
            if (!arOnly) {
                showMessage('error', 'Please select an option for AR Only.');
                return false;
            }
        }

        // Validate each day row — skip in tournament mode (day rows are hidden)
        const dayRows = window._tournamentMode ? [] : document.querySelectorAll('.day-row');
        for (let i = 0; i < dayRows.length; i++) {
            const row = dayRows[i];
            const date = row.querySelector('input[name="availableDate[]"]').value;
            const startTime = row.querySelector('[name="startTime[]"]').value;
            const endTime = row.querySelector('[name="endTime[]"]').value;
            const dayNum = i + 1;

            if (!date) {
                showMessage('error', `Please select a date for Day ${dayNum}.`);
                return false;
            }

            const selectedDate = new Date(date + 'T00:00:00'); // local time, not UTC
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                showMessage('error', `Day ${dayNum}: Please select a date in the future.`);
                return false;
            }

            if (!startTime) {
                showMessage('error', `Day ${dayNum}: Please select a start time.`);
                return false;
            }
            if (!endTime) {
                showMessage('error', `Day ${dayNum}: Please select an end time.`);
                return false;
            }
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            if (end <= start) {
                showMessage('error', `Day ${dayNum}: End time must be after start time.`);
                return false;
            }
        }

        return true;
    }

    /**
     * Show message to user
     */
    function showMessage(type, message) {
        formMessage.className = `form-message ${type}`;
        formMessage.textContent = message;
        formMessage.style.display = 'block';
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Hide message
     */
    function hideMessage() {
        formMessage.style.display = 'none';
    }

    // ── Shared email helper ───────────────────────────────────────────────────
    function emailReady() {
        if (typeof emailjs === 'undefined') return false;
        if (!CONFIG?.EMAILJS?.SERVICE_ID || !CONFIG?.EMAILJS?.TEMPLATE_ID) return false;
        if (CONFIG.EMAILJS.PUBLIC_KEY === 'your_emailjs_public_key') return false;
        return true;
    }

    function buildDayLines(includMax = true) {
        const fmt = t => {
            if (!t) return '';
            const [h, m] = t.split(':').map(Number);
            return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
        };
        return Array.from(document.querySelectorAll('.day-row')).map((row, i) => {
            const date  = row.querySelector('input[name="availableDate[]"]').value;
            const start = row.querySelector('[name="startTime[]"]').value;
            const end   = row.querySelector('[name="endTime[]"]').value;
            const max   = row.querySelector('input[name="maxGames[]"]').value || '1';
            const maxPart = includMax ? `  |  Max games: ${max}` : '';
            return `  Day ${i + 1}: ${date}  |  ${fmt(start)} – ${fmt(end)}${maxPart}`;
        }).join('\n');
    }

    // ── Confirmation email ────────────────────────────────────────────────────
    async function sendConfirmationEmail() {
        if (!emailReady()) return;
        const firstName = document.getElementById('refereeFirstName').value.trim();
        const lastName  = document.getElementById('refereeLastName').value.trim();
        const email     = document.getElementById('refereeEmail').value.trim();
        if (!email) return;

        const clubs     = getCheckboxValues('locations').join(', ') || 'None selected';
        const ageGroups = getCheckboxValues('ageGroups').join(', ') || 'No preference';
        const arOnly    = document.getElementById('arOnly').value || '—';
        const notes     = document.getElementById('notes').value.trim() || 'None';

        await emailjs.send(CONFIG.EMAILJS.SERVICE_ID, CONFIG.EMAILJS.TEMPLATE_ID, {
            to_name:              `${firstName} ${lastName}`,
            to_email:             email,
            intro:                'Your availability has been submitted. Here\'s what we have on file:',
            availability_details: buildDayLines(true),
            preferred_clubs:      clubs,
            extra_lines:          `Age groups: ${ageGroups}\nAR Only: ${arOnly}\nNotes: ${notes}`,
        });
    }

    // ── Parent / Guardian email ───────────────────────────────────────────────
    async function sendParentEmail() {
        if (!emailReady()) return;
        const guardianEmail = document.getElementById('guardianEmail')?.value.trim();
        if (!guardianEmail) return;

        const firstName     = document.getElementById('refereeFirstName').value.trim();
        const lastName      = document.getElementById('refereeLastName').value.trim();
        const guardianFirst = document.getElementById('guardianFirstName')?.value.trim() || '';
        const guardianLast  = document.getElementById('guardianLastName')?.value.trim()  || '';
        const clubs         = getCheckboxValues('locations').join(', ') || 'None selected';

        await emailjs.send(CONFIG.EMAILJS.SERVICE_ID, CONFIG.EMAILJS.TEMPLATE_ID, {
            to_name:              `${guardianFirst} ${guardianLast}`.trim(),
            to_email:             guardianEmail,
            intro:                `${firstName} ${lastName} has submitted referee availability for the upcoming weekend.`,
            availability_details: buildDayLines(false),
            preferred_clubs:      clubs,
            extra_lines:          `Questions? Contact the assignor at ${CONFIG.ASSIGNOR_EMAIL || ''}`,
        });
    }

    // Phone number formatting
    const phoneInput = document.getElementById('refereePhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = `(${value}`;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                } else {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                }
            }
            e.target.value = value;
        });
    }

    // Clear messages when user starts typing
    form.addEventListener('input', function() {
        if (formMessage.style.display === 'block') {
            setTimeout(hideMessage, 3000);
        }
    });
});
