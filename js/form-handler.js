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

                // Save Club Preference from location checkboxes
                const locations = getCheckboxValues('locations');
                if (locations.length > 0) {
                    refUpdates['Club Preference'] = locations.join(', ');
                }

                // Save Certification Level if present
                const certEl = document.getElementById('certificationLevel');
                if (certEl?.value) refUpdates['Certification Level'] = certEl.value;

                if (Object.keys(refUpdates).length > 0) {
                    try {
                        await airtableClient.updateRecord(
                            CONFIG.AIRTABLE_TABLES.REFEREES,
                            window._foundRefId,
                            refUpdates
                        );
                    } catch(updateErr) {
                        console.warn('Could not update referee profile:', updateErr.message);
                    }
                }
            }

            const dayRows = document.querySelectorAll('.day-row');

            // Create one availability record per day
            const submissions = [];
            dayRows.forEach(row => {
                const formData = collectFormData(row);
                submissions.push(airtableClient.createAvailability(formData));
            });

            await Promise.all(submissions);

            // Send confirmation email (non-blocking — availability already saved)
            try {
                await sendConfirmationEmail();
            } catch(emailErr) {
                console.warn('Confirmation email not sent:', emailErr.message);
            }

            // Send parent/guardian email if referee is under 18
            try {
                await sendParentEmail();
            } catch(parentErr) {
                console.warn('Parent email not sent:', parentErr.message);
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

        const formData = {
            'Referee Name': `${firstName} ${lastName}`,
            'Date':         dayRow.querySelector('input[name="availableDate[]"]').value,
            'Start Time':   dayRow.querySelector('[name="startTime[]"]').value,
            'End Time':     dayRow.querySelector('[name="endTime[]"]').value,
            'Max Games':    dayRow.querySelector('input[name="maxGames[]"]').value || '1',
            'Notes':        document.getElementById('notes').value.trim(),
            'Status':       'New'
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
        const locations = getCheckboxValues('locations');
        if (locations.length === 0) {
            showMessage('error', 'Please select at least one preferred location.');
            return false;
        }

        const arOnly = document.getElementById('arOnly').value;
        if (!arOnly) {
            showMessage('error', 'Please select an option for AR Only.');
            return false;
        }

        // Validate each day row
        const dayRows = document.querySelectorAll('.day-row');
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

            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                showMessage('error', `Day ${dayNum}: Please select a date in the future.`);
                return false;
            }

            if (startTime && endTime) {
                const start = new Date(`2000-01-01T${startTime}`);
                const end = new Date(`2000-01-01T${endTime}`);
                if (end <= start) {
                    showMessage('error', `Day ${dayNum}: End time must be after start time.`);
                    return false;
                }
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

    // ── Confirmation email ────────────────────────────────────────────────────
    async function sendConfirmationEmail() {
        if (typeof emailjs === 'undefined') return;
        if (!CONFIG?.EMAILJS?.SERVICE_ID || !CONFIG?.EMAILJS?.TEMPLATE_ID) return;
        if (CONFIG.EMAILJS.PUBLIC_KEY === 'your_emailjs_public_key') return;

        const firstName = document.getElementById('refereeFirstName').value.trim();
        const lastName  = document.getElementById('refereeLastName').value.trim();
        const email     = document.getElementById('refereeEmail').value.trim();
        if (!email) return;

        // Format each availability day
        const dayRows = document.querySelectorAll('.day-row');
        const dayLines = Array.from(dayRows).map((row, i) => {
            const date  = row.querySelector('input[name="availableDate[]"]').value;
            const start = row.querySelector('[name="startTime[]"]').value;
            const end   = row.querySelector('[name="endTime[]"]').value;
            const max   = row.querySelector('input[name="maxGames[]"]').value || '1';
            const fmt = t => {
                if (!t) return '';
                const [h, m] = t.split(':').map(Number);
                const ap = h >= 12 ? 'PM' : 'AM';
                return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ap}`;
            };
            return `  Day ${i + 1}: ${date}  |  ${fmt(start)} – ${fmt(end)}  |  Max games: ${max}`;
        }).join('\n');

        const clubs     = getCheckboxValues('locations').join(', ') || 'None selected';
        const ageGroups = getCheckboxValues('ageGroups').join(', ') || 'No preference';
        const arOnly    = document.getElementById('arOnly').value || '—';
        const notes     = document.getElementById('notes').value.trim() || 'None';

        await emailjs.send(CONFIG.EMAILJS.SERVICE_ID, CONFIG.EMAILJS.TEMPLATE_ID, {
            to_name:              `${firstName} ${lastName}`,
            to_email:             email,
            availability_details: dayLines,
            preferred_clubs:      clubs,
            age_groups:           ageGroups,
            ar_only:              arOnly,
            notes:                notes,
        });
    }

    // ── Parent / Guardian email ───────────────────────────────────────────────
    async function sendParentEmail() {
        if (typeof emailjs === 'undefined') return;
        if (!CONFIG?.EMAILJS?.SERVICE_ID || !CONFIG?.EMAILJS?.PARENT_TEMPLATE_ID) return;
        if (CONFIG.EMAILJS.PUBLIC_KEY === 'your_emailjs_public_key') return;
        if (CONFIG.EMAILJS.PARENT_TEMPLATE_ID === 'your_parent_template_id') return;

        const guardianEmail = document.getElementById('guardianEmail')?.value.trim();
        if (!guardianEmail) return; // not under 18 or section hidden

        const firstName = document.getElementById('refereeFirstName').value.trim();
        const lastName  = document.getElementById('refereeLastName').value.trim();
        const guardianFirst = document.getElementById('guardianFirstName')?.value.trim() || '';
        const guardianLast  = document.getElementById('guardianLastName')?.value.trim()  || '';

        const dayRows = document.querySelectorAll('.day-row');
        const dayLines = Array.from(dayRows).map((row, i) => {
            const date  = row.querySelector('input[name="availableDate[]"]').value;
            const start = row.querySelector('[name="startTime[]"]').value;
            const end   = row.querySelector('[name="endTime[]"]').value;
            const fmt = t => {
                if (!t) return '';
                const [h, m] = t.split(':').map(Number);
                return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
            };
            return `  Day ${i + 1}: ${date}  |  ${fmt(start)} – ${fmt(end)}`;
        }).join('\n');

        const clubs = getCheckboxValues('locations').join(', ') || 'None selected';

        await emailjs.send(CONFIG.EMAILJS.SERVICE_ID, CONFIG.EMAILJS.PARENT_TEMPLATE_ID, {
            guardian_name:        `${guardianFirst} ${guardianLast}`.trim(),
            to_email:             guardianEmail,
            referee_name:         `${firstName} ${lastName}`,
            availability_details: dayLines,
            preferred_clubs:      clubs,
            assignor_email:       CONFIG.ASSIGNOR_EMAIL || '',
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
