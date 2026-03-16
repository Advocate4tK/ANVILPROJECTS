/**
 * Airtable Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this file and rename it to "config.js"
 * 2. Fill in your actual Airtable credentials below
 * 3. DO NOT commit config.js to public repositories (it contains secrets)
 *
 * HOW TO GET YOUR CREDENTIALS:
 *
 * Personal Access Token:
 *   1. Go to https://airtable.com/create/tokens
 *   2. Click "Create new token"
 *   3. Give it a name (e.g., "Referee Scheduling Form")
 *   4. Add scopes: data.records:read and data.records:write
 *   5. Add access to your "Referee Scheduling" base
 *   6. Click "Create token" and copy it
 *
 * Base ID:
 *   1. Go to https://airtable.com/api
 *   2. Select your "Referee Scheduling" base
 *   3. The Base ID is shown in the introduction (starts with "app")
 *   4. Or find it in the URL when viewing your base
 *
 * Table Names:
 *   - These should match EXACTLY what you named your tables in Airtable
 *   - Default names are provided below
 */

const CONFIG = {
    // Your Airtable Personal Access Token
    // Example: 'patAbCdEfGhIjKlMnOpQrStUvWxYz'
    AIRTABLE_API_KEY: 'your_api_key_here',

    // Your Airtable Base ID
    // Example: 'appAbC123XyZ456'
    AIRTABLE_BASE_ID: 'your_base_id_here',

    // Table names in your Airtable base
    // IMPORTANT: These must match EXACTLY (case-sensitive)
    AIRTABLE_TABLES: {
        REFEREES: 'Referees',
        CLUBS: 'Clubs',
        FIELDS: 'Fields',
        GAMES: 'Games',
        AVAILABILITY: 'Availability'
    },

    // API endpoint (don't change this)
    AIRTABLE_API_URL: 'https://api.airtable.com/v0',

    // EmailJS — sends confirmation emails to referees after availability submission
    // Setup: https://www.emailjs.com  (free tier = 200 emails/month)
    //   1. Create account → Add Email Service (connect Gmail) → note the Service ID
    //   2. Create Email Template → note the Template ID
    //   3. Account → API Keys → copy your Public Key
    EMAILJS: {
        PUBLIC_KEY:  'your_emailjs_public_key',   // Account > API Keys
        SERVICE_ID:  'your_emailjs_service_id',   // Email Services tab
        TEMPLATE_ID: 'your_emailjs_template_id'   // Email Templates tab
    },

    // Form settings
    FORM_SETTINGS: {
        // Show success message for this many milliseconds
        successMessageDuration: 5000,

        // Redirect after successful submission (leave empty to stay on page)
        redirectAfterSubmit: '',

        // Enable form validation
        enableValidation: true
    }
};

// Make config available globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
