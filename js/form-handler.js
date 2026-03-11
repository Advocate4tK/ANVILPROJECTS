/**
 * Form Handler for Referee Availability Form
 *
 * Handles form submission and validation
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('availabilityForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    if (!form) {
        console.error('Form not found');
        return;
    }

    // Check if Airtable client is available
    if (!airtableClient) {
        showMessage('error', 'Configuration error: Airtable client not initialized. Please check config.js');
        submitBtn.disabled = true;
        return;
    }

    // Set minimum date to today
    const dateInput = document.getElementById('availableDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Disable submit button and show loading
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = 'Submitting... <span class="spinner"></span>';

        try {
            // Collect form data
            const formData = collectFormData();

            // Submit to Airtable
            const result = await airtableClient.createAvailability(formData);

            // Show success message
            showMessage('success', 'Thank you! Your availability has been submitted successfully. We will contact you soon.');

            // Reset form after short delay
            setTimeout(() => {
                form.reset();
                hideMessage();
            }, 3000);

        } catch (error) {
            console.error('Submission error:', error);
            showMessage('error', `Failed to submit form: ${error.message}. Please try again or contact your assignor.`);
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    /**
     * Collect all form data
     */
    function collectFormData() {
        const formData = {
            // Personal Information
            'Referee Name': document.getElementById('refereeName').value.trim(),
            'Referee Email': document.getElementById('refereeEmail').value.trim(),
            'Referee Phone': document.getElementById('refereePhone').value.trim(),
            'Certification Level': document.getElementById('certificationLevel').value,

            // Availability
            'Date': document.getElementById('availableDate').value,
            'Start Time': document.getElementById('startTime').value,
            'End Time': document.getElementById('endTime').value,

            // Locations
            'Preferred Locations': getCheckboxValues('locations'),

            // Positions
            'Positions Willing': getCheckboxValues('positions'),

            // Age Groups
            'Age Groups Preferred': getCheckboxValues('ageGroups'),

            // Additional
            'Notes': document.getElementById('notes').value.trim(),

            // Status
            'Status': 'New'
        };

        // Add travel distance if provided
        const travelDistance = document.getElementById('travelDistance').value;
        if (travelDistance) {
            formData['Travel Distance'] = parseInt(travelDistance);
        }

        return formData;
    }

    /**
     * Get selected checkbox values
     */
    function getCheckboxValues(name) {
        const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
        const values = Array.from(checkboxes).map(cb => cb.value);
        return values.length > 0 ? values : [];
    }

    /**
     * Validate form data
     */
    function validateForm() {
        // Check required checkboxes
        const locations = getCheckboxValues('locations');
        if (locations.length === 0) {
            showMessage('error', 'Please select at least one preferred location.');
            return false;
        }

        const positions = getCheckboxValues('positions');
        if (positions.length === 0) {
            showMessage('error', 'Please select at least one position you are willing to work.');
            return false;
        }

        // Validate time range
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);

            if (end <= start) {
                showMessage('error', 'End time must be after start time.');
                return false;
            }
        }

        // Validate date is not in the past
        const selectedDate = new Date(document.getElementById('availableDate').value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            showMessage('error', 'Please select a date in the future.');
            return false;
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

        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Hide message
     */
    function hideMessage() {
        formMessage.style.display = 'none';
    }

    /**
     * Format phone number as user types
     */
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

    /**
     * Clear messages when user starts typing
     */
    form.addEventListener('input', function() {
        if (formMessage.style.display === 'block') {
            setTimeout(hideMessage, 3000);
        }
    });
});

/**
 * Helper function to format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Helper function to format time for display
 */
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}
