# Referee Scheduling System

A complete web-based referee scheduling system that integrates with Airtable for managing referee assignments, availability, clubs, fields, and games.

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [What's Included](#whats-included)
3. [Setup Instructions](#setup-instructions)
4. [Deployment Guide](#deployment-guide)
5. [How to Use](#how-to-use)

---

## System Overview

This system allows you to:
- **Referees** submit availability through a web form
- **Admins** view and filter referees based on date, location, and availability
- **Assign** referees to games with full relationship tracking
- **Manage** clubs, fields, and game schedules in one place

### Database Structure (5 Tables in Airtable)

1. **Referees** - Referee profiles with certifications and preferences
2. **Clubs** - Club information with assignors and regions
3. **Fields/Locations** - Field details linked to clubs
4. **Games** - Game schedules with referee assignments
5. **Availability** - Referee availability submissions from the web form

---

## What's Included

```
referee tool/
├── README.md                          # This file
├── SETUP_GUIDE.md                     # Detailed Airtable setup
├── DEPLOYMENT_GUIDE.md                # How to deploy to web hosting
├── index.html                         # Main landing page
├── referee-availability-form.html     # Referee signup form
├── config.template.js                 # Configuration template
├── config.js                          # Your actual config (create from template)
├── js/
│   ├── airtable-client.js            # Airtable API integration
│   └── form-handler.js               # Form submission logic
├── css/
│   └── styles.css                    # Styling for all pages
└── airtable/
    ├── base-structure.json           # Airtable base schema
    └── field-definitions.md          # Detailed field specifications

```

---

## Setup Instructions

### Step 1: Set Up Airtable

1. **Create a free Airtable account** at https://airtable.com
2. **Create a new base** called "Referee Scheduling"
3. **Follow the detailed setup guide** in `SETUP_GUIDE.md` to create all 5 tables
4. **Get your API credentials**:
   - Go to https://airtable.com/account
   - Generate a Personal Access Token with `data.records:read` and `data.records:write` permissions
   - Note your Base ID (found in API docs for your base)

### Step 2: Configure the Application

1. Copy `config.template.js` to `config.js`:
   ```bash
   cp config.template.js config.js
   ```

2. Edit `config.js` and add your credentials:
   ```javascript
   const CONFIG = {
       AIRTABLE_API_KEY: 'your_api_key_here',
       AIRTABLE_BASE_ID: 'your_base_id_here',
       // ... other settings
   };
   ```

3. **IMPORTANT**: Never commit `config.js` to public repositories (it contains secrets)

### Step 3: Test Locally

1. Open `index.html` in a web browser
2. Click "Referee Availability Form"
3. Fill out and submit the form
4. Check your Airtable base to see if the data appears in the Availability table

---

## Deployment Guide

See `DEPLOYMENT_GUIDE.md` for detailed instructions on deploying to:
- Static web hosting (Netlify, Vercel, GitHub Pages)
- Web server (Apache, Nginx)
- Cloud platforms (AWS S3, Google Cloud Storage)

### Quick Deploy Options

**Option 1: Netlify (Recommended - Free & Easy)**
1. Drag and drop the entire `referee tool` folder to https://app.netlify.com/drop
2. Done! You'll get a public URL instantly

**Option 2: GitHub Pages**
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings

**Option 3: Your Own Server**
1. ZIP the entire folder
2. Upload to your web server
3. Extract and serve via Apache/Nginx

---

## How to Use

### For Referees:
1. Visit the website
2. Click "Submit Availability"
3. Fill out:
   - Name
   - Contact info
   - Dates available
   - Preferred locations
   - Positions willing to work
4. Submit!

### For Admins (in Airtable):
1. Open your Airtable base
2. Go to "Availability" table to see submissions
3. Use filters to find referees:
   - Date = Saturday
   - Location = Rye
   - Age Group = U14
4. Assign referees to games in the "Games" table
5. Create custom views for different scenarios

### Example Workflow:
1. **Referee submits availability** → Data enters Availability table
2. **Admin filters available referees** → Views show matching referees
3. **Admin assigns to game** → Updates Games table with referee assignments
4. **System tracks everything** → Full history and relationships maintained

---

## Support & Customization

### Adding New Fields:
- Edit the HTML form to add new input fields
- Update `js/form-handler.js` to capture the new data
- Add corresponding fields in your Airtable table

### Customizing Appearance:
- Edit `css/styles.css` to change colors, fonts, layout
- Modify HTML files for structural changes

### Need Help?
- Check `SETUP_GUIDE.md` for detailed Airtable configuration
- Check `DEPLOYMENT_GUIDE.md` for hosting instructions
- Review `airtable/field-definitions.md` for database schema details

---

## Security Notes

⚠️ **IMPORTANT**:
- Never expose your Airtable API key publicly
- The `config.js` file should NOT be committed to public repositories
- For production, consider using a backend proxy to hide API keys
- This current setup is suitable for internal/private use

---

## License

Free to use and modify for your organization.
