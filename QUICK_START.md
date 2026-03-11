# Quick Start Guide

Get your Referee Scheduling System up and running in 30 minutes!

## ⚡ Fast Track Setup

### Step 1: Set Up Airtable (15 minutes)

1. **Create account**: Go to https://airtable.com and sign up (free)

2. **Create base**: Click "Add a base" → "Start from scratch" → Name it "Referee Scheduling"

3. **Create 5 tables**:
   - Rename first table to "Referees"
   - Add 4 more tables: "Clubs", "Fields", "Games", "Availability"

4. **Add fields to each table**: Follow the simple checklist in `SETUP_GUIDE.md` (Section: Create the Tables)
   - Or use the quick reference in `airtable/field-definitions.md`

5. **Get your credentials**:
   - API Token: https://airtable.com/create/tokens → Create new token → Give it read/write permissions
   - Base ID: https://airtable.com/api → Select your base → Copy the Base ID (starts with "app")

### Step 2: Configure the Application (5 minutes)

1. **Copy the config template**:
   ```bash
   # On Windows
   copy config.template.js config.js

   # On Mac/Linux
   cp config.template.js config.js
   ```

2. **Edit config.js**: Open in any text editor and paste your credentials:
   ```javascript
   const CONFIG = {
       AIRTABLE_API_KEY: 'patYourTokenHere',  // Paste your token
       AIRTABLE_BASE_ID: 'appYourBaseIdHere',  // Paste your base ID
       // ... rest stays the same
   };
   ```

3. **Save the file**

### Step 3: Test Locally (5 minutes)

1. **Open the form**: Double-click `index.html` to open in your web browser

2. **Navigate**: Click "Submit Availability"

3. **Fill out form**: Enter test data
   - Use a real email so you can verify
   - Select at least one location and position
   - Pick a future date

4. **Submit**: Click "Submit Availability"

5. **Verify**: Check your Airtable base → Availability table → You should see your submission!

### Step 4: Deploy (5 minutes)

**Easiest Method - Netlify Drop:**

1. Go to https://app.netlify.com/drop

2. Drag and drop your entire "referee tool" folder onto the page

3. Wait 30 seconds

4. Copy your live URL (e.g., `https://referee-tool-xyz.netlify.app`)

5. Share with your referees!

**Done! 🎉**

---

## 📋 What You Can Do Now

### For Referees:
- Visit your deployed URL
- Submit availability anytime
- Get assigned to games

### For Admins:
1. **View submissions**: Open your Airtable base → Availability table
2. **Filter referees**: Use filters to find available referees
   - Example: Date = Saturday, Location = Rye
3. **Assign games**:
   - Go to Games table
   - Create new game record
   - Link referees in Center Ref, AR1, AR2 fields
4. **Track everything**: All data synced and searchable

---

## 🎯 Common Tasks

### Add Sample Data

**Sample Referee:**
1. Go to Referees table
2. Add record:
   - Name: John Smith
   - Email: john@example.com
   - Phone: (555) 123-4567
   - Certification: Grade 6
   - Status: Active

**Sample Club:**
1. Go to Clubs table
2. Add record:
   - Club Name: Rye Soccer Club
   - Region: East

**Sample Field:**
1. Go to Fields table
2. Add record:
   - Field Name: Rye Field 1
   - City: Rye
   - Link to Rye Soccer Club

**Sample Game:**
1. Go to Games table
2. Add record:
   - Date: This Saturday
   - Time: 10:00 AM
   - Field: Rye Field 1
   - Age Group: U14
   - Game Status: Scheduled

### Filter for Available Referees

**Scenario**: Need a center ref for Saturday at Rye, U14 game

1. Go to Availability table
2. Click "Filter" button
3. Add filters:
   - `Date` = [This Saturday]
   - `Preferred Locations` contains "Rye"
   - `Positions Willing` contains "Center Referee"
   - `Status` = "New"
4. See matching referees!

### Assign a Referee to a Game

1. Go to Games table
2. Find the game (or create new)
3. Click in "Center Ref" field
4. Select referee from dropdown (or search by name)
5. Repeat for AR1, AR2 if needed
6. Update Game Status to "Confirmed"

### Process New Submissions

1. Go to Availability table
2. Use "New Submissions" view
3. For each submission:
   - Review details
   - Link to existing Referee (if they have a record)
   - Update Status to "Reviewed"
4. When you assign them to a game:
   - Update Status to "Assigned"

---

## 🔧 Customization

### Change Location List

**In the form:**
1. Edit `referee-availability-form.html`
2. Find the "Preferred Locations" section (around line 100)
3. Add/remove checkbox options

**In Airtable:**
1. Go to Availability table
2. Click "Preferred Locations" field
3. "Customize field type"
4. Add/remove options (must match form exactly)

### Add a New Field

**Example**: Add "Years of Experience"

1. **In Airtable** (Availability table):
   - Add field: "Years Experience"
   - Type: Number

2. **In Form** (`referee-availability-form.html`):
   ```html
   <div class="form-group">
       <label for="yearsExp">Years of Experience</label>
       <input type="number" id="yearsExp" name="yearsExp" min="0">
   </div>
   ```

3. **In Form Handler** (`js/form-handler.js`):
   - Find `collectFormData()` function
   - Add: `'Years Experience': document.getElementById('yearsExp').value`

4. **Test it!**

---

## 🚨 Troubleshooting

### "Configuration error" message
- **Problem**: config.js not found or incorrect
- **Fix**: Make sure you copied `config.template.js` to `config.js` and filled in credentials

### Form submits but no data in Airtable
- **Problem**: API token doesn't have write permissions
- **Fix**: Go to https://airtable.com/create/tokens → Edit token → Add `data.records:write` scope

### "Field not found" error
- **Problem**: Field name mismatch between form and Airtable
- **Fix**: Check that field names in Airtable match exactly what's in `form-handler.js` (case-sensitive!)

### Form looks unstyled
- **Problem**: CSS file not loading
- **Fix**: Make sure `css/styles.css` exists and path is correct in HTML

### Can't deploy to Netlify
- **Problem**: Folder structure incorrect
- **Fix**: Make sure you're dragging the entire "referee tool" folder, not just individual files

---

## 📞 Get Help

### Documentation
- Full setup: `SETUP_GUIDE.md`
- Deployment options: `DEPLOYMENT_GUIDE.md`
- Field reference: `airtable/field-definitions.md`

### Airtable Help
- Support: https://support.airtable.com
- API Docs: https://airtable.com/api
- Community: https://community.airtable.com

---

## 🎓 Learning Path

**Week 1: Basic Usage**
- Set up all 5 tables
- Add sample data
- Process test submissions

**Week 2: Customization**
- Add your locations
- Customize age groups
- Create custom views

**Week 3: Automation**
- Set up email notifications (Airtable Automations)
- Create assignment workflows
- Build custom reports

**Week 4: Advanced**
- Integrate with calendars
- Add payment tracking
- Build admin dashboard

---

## ✅ Success Checklist

- [ ] Airtable base created with 5 tables
- [ ] All fields added to each table
- [ ] API credentials obtained
- [ ] config.js configured
- [ ] Tested locally - form submission works
- [ ] Deployed to web (Netlify or other)
- [ ] Shared URL with referees
- [ ] Created sample games
- [ ] Processed first real submission
- [ ] Assigned first referee to a game

**Congratulations! You're ready to manage referee scheduling! 🎉⚽**

---

## 💡 Pro Tips

1. **Mobile-friendly**: The form works great on phones - referees can submit on the go
2. **Multiple dates**: Have referees submit separate forms for each date
3. **Regular cleanup**: Archive old availability submissions monthly
4. **Views are powerful**: Create different views for different scenarios
5. **Share views**: You can share read-only views with assignors
6. **Export data**: Airtable can export to CSV for reports
7. **Backup regularly**: Download CSV backups of all tables monthly

---

## Next Steps

1. **Populate your data**: Add all your referees, clubs, fields
2. **Share with team**: Send URL to referees to start collecting availability
3. **Train assignors**: Show them how to filter and assign
4. **Gather feedback**: Ask users what features would help
5. **Iterate**: Customize based on your needs

**Need more help?** Read the detailed guides in this folder!
