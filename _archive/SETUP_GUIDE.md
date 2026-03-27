# Airtable Setup Guide

This guide will walk you through setting up your Airtable base for the Referee Scheduling System.

## Step 1: Create Your Airtable Account

1. Go to https://airtable.com
2. Sign up for a free account (or log in if you have one)
3. The free plan is sufficient for most small to medium organizations

## Step 2: Create a New Base

1. Click "Add a base" or "Create a base"
2. Choose "Start from scratch"
3. Name it: **"Referee Scheduling"**

## Step 3: Create the Tables

You'll create 5 tables. Here's how to set up each one:

---

### Table 1: REFEREES

**Rename the first table** (usually called "Table 1") to "Referees"

Add these fields (click the + button to add fields):

| Field Name | Field Type | Options/Notes |
|------------|-----------|---------------|
| Referee ID | Autonumber | (Airtable auto-generates) |
| Name | Single line text | Required |
| Email | Email | Required |
| Phone | Phone number | |
| Certification Level | Single select | Options: Grade 8, Grade 7, Grade 6, Grade 5, Regional, National |
| Travel Distance | Number | Miles willing to travel |
| Clubs | Link to another record | Link to "Clubs" table (multiple) |
| Notes | Long text | |
| Status | Single select | Options: Active, Inactive, On Leave |

**View the Referee ID**: Make sure "Referee ID" is visible as the first column for easy reference.

---

### Table 2: CLUBS

**Add a new table** called "Clubs"

Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|-----------|---------------|
| Club ID | Autonumber | (Airtable auto-generates) |
| Club Name | Single line text | Required - this is your primary field |
| Assignor | Single line text | Name of person assigning games |
| Assignor Email | Email | |
| Assignor Phone | Phone number | |
| Region | Single select | Options: North, South, East, West, Central (customize to your regions) |
| Referees | Link to another record | Link to "Referees" table (multiple) |
| Fields | Link to another record | Link to "Fields" table (multiple) |
| Notes | Long text | |

---

### Table 3: FIELDS (Locations)

**Add a new table** called "Fields"

Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|-----------|---------------|
| Field ID | Autonumber | (Airtable auto-generates) |
| Field Name | Single line text | Required - primary field (e.g., "Rye Field 1") |
| Address | Single line text | Full address |
| City | Single line text | |
| State | Single line text | |
| Zip Code | Single line text | |
| Club | Link to another record | Link to "Clubs" table (single) |
| GPS Coordinates | Single line text | Optional: "lat,long" format |
| Parking Notes | Long text | |
| Field Notes | Long text | Surface type, size, amenities |

---

### Table 4: GAMES

**Add a new table** called "Games"

Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|-----------|---------------|
| Game ID | Autonumber | (Airtable auto-generates) |
| Date | Date | Date only (no time) |
| Time | Single line text | e.g., "10:00 AM" or use Duration field |
| Field | Link to another record | Link to "Fields" table (single) |
| Home Team | Single line text | |
| Away Team | Single line text | |
| Age Group | Single select | Options: U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18, U19 |
| Division | Single select | Options: Recreational, Travel, Premier, Elite |
| Center Ref | Link to another record | Link to "Referees" table (single) |
| AR1 | Link to another record | Link to "Referees" table (single) |
| AR2 | Link to another record | Link to "Referees" table (single) |
| Club | Link to another record | Link to "Clubs" table (single) |
| Game Status | Single select | Options: Scheduled, Confirmed, Completed, Cancelled |
| Payment Status | Single select | Options: Pending, Paid, Invoiced |
| Notes | Long text | |

**Create useful views in this table:**
- "This Weekend" - Filter: Date is this week
- "Needs Referees" - Filter: Center Ref is empty
- "By Field" - Group by: Field

---

### Table 5: AVAILABILITY (Form Submissions)

**Add a new table** called "Availability"

Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|-----------|---------------|
| Submission ID | Autonumber | (Airtable auto-generates) |
| Referee | Link to another record | Link to "Referees" table (single) |
| Referee Name | Single line text | For form submissions (before linking) |
| Referee Email | Email | For matching to existing referees |
| Referee Phone | Phone number | |
| Date | Date | Single date they're available |
| Start Time | Single line text | e.g., "8:00 AM" |
| End Time | Single line text | e.g., "5:00 PM" |
| Preferred Locations | Multiple select | Options: (list your common fields/cities) |
| Positions Willing | Multiple select | Options: Center Referee, AR1, AR2, 4th Official |
| Age Groups Preferred | Multiple select | Options: U8-U10, U11-U12, U13-U14, U15-U16, U17-U19 |
| Notes | Long text | Any additional info from referee |
| Status | Single select | Options: New, Reviewed, Assigned, Archived |
| Submitted At | Created time | Automatically tracks when submitted |

**Create useful views:**
- "New Submissions" - Filter: Status = New
- "By Date" - Sort by: Date (ascending)
- "Available This Weekend" - Filter: Date is this week

---

## Step 4: Set Up Relationships

The power of Airtable is in the relationships between tables. Here's how they connect:

```
REFEREES ←→ CLUBS (many-to-many)
   ↓
AVAILABILITY (many-to-one)

CLUBS → FIELDS (one-to-many)
   ↓
GAMES (many-to-one)
   ↑
FIELDS (many-to-one)
REFEREES (for Center Ref, AR1, AR2)
```

When you create "Link to another record" fields (done above), Airtable automatically creates the reverse link in the other table.

---

## Step 5: Create Useful Views

### In the AVAILABILITY table:

**View 1: "Available by Date"**
- Sort: Date (ascending)
- Group by: Date
- Filter: Status = New or Reviewed

**View 2: "Filter Example"**
- Use filters to find referees for specific scenarios:
  - Date = [specific date]
  - Preferred Locations contains "Rye"
  - Positions Willing contains "Center Referee"
  - Age Groups Preferred contains "U14"

### In the GAMES table:

**View 1: "Unassigned Games"**
- Filter: Center Ref is empty
- Sort: Date (ascending)

**View 2: "This Weekend"**
- Filter: Date is within the next 7 days
- Sort: Date, then Time

---

## Step 6: Get Your API Credentials

### Get Your Personal Access Token:

1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name it: "Referee Scheduling Form"
4. Add these scopes:
   - `data.records:read`
   - `data.records:write`
5. Add access to your "Referee Scheduling" base
6. Click "Create token"
7. **COPY THE TOKEN** - you'll need this for `config.js`

### Get Your Base ID:

1. Go to https://airtable.com/api
2. Click on your "Referee Scheduling" base
3. The Base ID is in the URL and in the introduction
   - It starts with "app" (e.g., `appXXXXXXXXXXXXXX`)
4. Copy this Base ID - you'll need it for `config.js`

### Get Your Table IDs:

1. In your base, click on any table
2. The Table ID is in the URL after the Base ID
3. You'll need the Table IDs for:
   - Referees table
   - Clubs table
   - Fields table
   - Games table
   - Availability table

---

## Step 7: Configure Your Web Application

1. Open `config.template.js`
2. Copy it to `config.js`
3. Fill in your credentials:

```javascript
const CONFIG = {
    AIRTABLE_API_KEY: 'patXXXXXXXXXXXXXX',  // Your Personal Access Token
    AIRTABLE_BASE_ID: 'appXXXXXXXXXXXXXX',   // Your Base ID
    AIRTABLE_TABLES: {
        REFEREES: 'Referees',
        CLUBS: 'Clubs',
        FIELDS: 'Fields',
        GAMES: 'Games',
        AVAILABILITY: 'Availability'
    }
};
```

---

## Step 8: Test the Integration

1. Open `referee-availability-form.html` in a web browser
2. Fill out the form with test data
3. Submit the form
4. Check your Airtable "Availability" table
5. You should see the new submission appear!

---

## Tips for Using Airtable

### Filtering for Game Assignment:
1. Go to Availability table
2. Click "Filter"
3. Add conditions:
   - Date = [select date]
   - Preferred Locations contains "Rye"
   - Positions Willing contains "Center Referee"
4. You'll see all matching referees

### Creating Automations (Premium Feature):
- Send email confirmations when referees submit availability
- Remind referees 24 hours before assigned games
- Notify assignors when new availability is submitted

### Sharing Views:
- Create a "Read Only" view for coaches/assignors
- Share specific views via link (Settings → Share view)
- Control what data each person can see

---

## Troubleshooting

**Form submissions not appearing?**
- Check your API token has write permissions
- Verify Base ID and Table names match exactly
- Check browser console for error messages

**Can't link records?**
- Make sure the linked table exists first
- Field names must match exactly
- Use the correct field type: "Link to another record"

**Need to add more options?**
- Single select and Multiple select fields can be edited anytime
- Click the field name → "Customize field type" → Add options

---

## Next Steps

1. ✅ Set up all 5 tables
2. ✅ Get API credentials
3. ✅ Configure `config.js`
4. ✅ Test the form
5. 📤 Deploy to web hosting (see DEPLOYMENT_GUIDE.md)
6. 👥 Share with your referee community!

---

## Need Help?

- Airtable Support: https://support.airtable.com
- Airtable API Docs: https://airtable.com/api
- Airtable Community: https://community.airtable.com
