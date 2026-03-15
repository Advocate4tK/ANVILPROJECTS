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
            const dayRows = document.querySelectorAll('.day-row');

            // Upsert referee record (create if new, update if existing)
            const firstName = document.getElementById('refereeFirstName').value.trim();
            const lastName  = document.getElementById('refereeLastName').value.trim();
            const refereeRecord = {
                'Name':                `${firstName} ${lastName}`,
                'Email':               document.getElementById('refereeEmail').value.trim(),
                'Phone':               document.getElementById('refereePhone').value.trim(),
                'Years Reffing':       document.getElementById('yearsReffing').value,
                'Certification Level': document.getElementById('certificationLevel').value,
                'AR Only':             document.getElementById('arOnly').value,
                'Preferred Locations': getCheckboxValues('locations'),
                'Age Groups Preferred':getCheckboxValues('ageGroups'),
                'Status':              'Active',
                'Last Submission':     new Date().toISOString().split('T')[0]
            };

            const addressEl = document.getElementById('refereeAddress');
            const cityEl    = document.getElementById('refereeCity');
            const stateEl   = document.getElementById('refereeState');
            const zipEl     = document.getElementById('refereeZip');
            if (addressEl && addressEl.value.trim()) refereeRecord['Address']  = addressEl.value.trim();
            if (cityEl    && cityEl.value.trim())    refereeRecord['City']     = cityEl.value.trim();
            if (stateEl   && stateEl.value.trim())   refereeRecord['State']    = stateEl.value.trim().toUpperCase();
            if (zipEl     && zipEl.value.trim())     refereeRecord['Zip Code'] = zipEl.value.trim();
            await airtableClient.upsertReferee(refereeRecord);

            // Create one availability record per day
            const submissions = [];
            dayRows.forEach(row => {
                const formData = collectFormData(row);
                submissions.push(airtableClient.createAvailability(formData));
            });

            await Promise.all(submissions);

            showMessage('success', 'Thank you! Your availability has been submitted successfully. We will contact you soon.');

            setTimeout(() => {
                form.reset();
                hideMessage();
            }, 3000);

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
            'Referee Name':         `${firstName} ${lastName}`,
            'Date':                 dayRow.querySelector('input[name="availableDate[]"]').value,
            'Start Time':           dayRow.querySelector('[name="startTime[]"]').value,
            'End Time':             dayRow.querySelector('[name="endTime[]"]').value,
            'Max Games':            parseInt(dayRow.querySelector('input[name="maxGames[]"]').value) || 1,
            'Preferred Locations':  getCheckboxValues('locations'),
            'AR Only':              document.getElementById('arOnly').value,
            'Age Groups Preferred': getCheckboxValues('ageGroups'),
            'Notes':                document.getElementById('notes').value.trim(),
            'Status':               'New'
        };

        const travelDistance = document.getElementById('travelDistance');
        if (travelDistance && travelDistance.value) {
            formData['Travel Distance'] = parseInt(travelDistance.value);
        }

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
