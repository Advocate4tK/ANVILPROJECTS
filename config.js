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
    // Supabase credentials
    SUPABASE_URL: 'https://kaniccdqieyesezpousu.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb',
    // Service role key — used ONLY in superadmin pages for admin API calls (password force-set)
    // Get from: Supabase Dashboard → Project Settings → API → service_role (secret)
    SUPABASE_SERVICE_KEY: '',


    // Airtable — DEPRECATED. Migrated to Supabase 2026-03-24. Keys removed.
    AIRTABLE_API_KEY: '',
    AIRTABLE_BASE_ID: '',

    // Table names in your Airtable base
    // IMPORTANT: These must match EXACTLY (case-sensitive)
    AIRTABLE_TABLES: {
        REFEREES: 'Referees',
        CLUBS: 'Clubs',
        FIELDS: 'Fields',
        GAMES: 'Games',
        AVAILABILITY: 'Availability',
        VENUES: 'Venues',
        SETTINGS: 'Settings',
        ASSIGNORS: 'Assignors'
    },

    // API endpoint (don't change this)
    AIRTABLE_API_URL: 'https://api.airtable.com/v0',

    // EmailJS — sends confirmation emails to referees after availability submission
    // Setup: https://www.emailjs.com  (free tier = 200 emails/month)
    //   1. Create account → Add Email Service (connect Gmail) → note the Service ID
    //   2. Create Email Template → note the Template ID
    //   3. Account → API Keys → copy your Public Key
    // Your email address — included in parent/guardian notification emails
    ASSIGNOR_EMAIL: 'nectassignor@gmail.com',

    EMAILJS: {
        PUBLIC_KEY:  'p0JPOZ4XKJ86egvTB',
        SERVICE_ID:  'nectassignor@gmail.com',
        TEMPLATE_ID: 'template_j04a0p6',
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
