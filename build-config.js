const fs = require('fs');

const config = `const CONFIG = {
    AIRTABLE_API_KEY: '${process.env.AIRTABLE_API_KEY}',
    AIRTABLE_BASE_ID: '${process.env.AIRTABLE_BASE_ID}',
    AIRTABLE_TABLES: {
        REFEREES: 'Referees',
        CLUBS: 'Clubs',
        FIELDS: 'Fields',
        GAMES: 'Games',
        AVAILABILITY: 'Availability',
        VENUES: 'Venues'
    },
    AIRTABLE_API_URL: 'https://api.airtable.com/v0',
    ASSIGNOR_EMAIL: '${process.env.ASSIGNOR_EMAIL}',
    EMAILJS: {
        PUBLIC_KEY:  '${process.env.EMAILJS_PUBLIC_KEY}',
        SERVICE_ID:  '${process.env.EMAILJS_SERVICE_ID}',
        TEMPLATE_ID: '${process.env.EMAILJS_TEMPLATE_ID}',
    },
    FORM_SETTINGS: {
        successMessageDuration: 5000,
        redirectAfterSubmit: '',
        enableValidation: true
    }
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
`;

fs.writeFileSync('config.js', config);
console.log('config.js generated successfully');
