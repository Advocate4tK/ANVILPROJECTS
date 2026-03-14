# Airtable Field Definitions

Detailed specifications for all fields in the Referee Scheduling database.

---

## Table 1: REFEREES

Master list of all referees in your system.

| Field Name | Type | Required | Options/Format | Description |
|------------|------|----------|----------------|-------------|
| **Referee ID** | Autonumber | Auto | Starts at 1 | Unique identifier for each referee |
| **Name** | Single line text | Yes | - | Full name of referee (PRIMARY FIELD) |
| **Email** | Email | Yes | - | Contact email address |
| **Phone** | Phone number | No | - | Contact phone number |
| **Certification Level** | Single select | No | Grade 8, Grade 7, Grade 6, Grade 5, Regional, National | Current referee certification |
| **Travel Distance** | Number | No | Integer | Maximum miles willing to travel |
| **Clubs** | Link to Clubs | No | Multiple | Clubs the referee works for |
| **Notes** | Long text | No | - | Additional notes about referee |
| **Status** | Single select | No | Active, Inactive, On Leave | Current availability status |
| **Availability Submissions** | Link to Availability | No | Multiple | Auto-linked from Availability table |
| **Games - Center** | Link to Games | No | Multiple | Games assigned as center referee |
| **Games - AR1** | Link to Games | No | Multiple | Games assigned as AR1 |
| **Games - AR2** | Link to Games | No | Multiple | Games assigned as AR2 |

### Usage Notes:
- The **Name** field is the primary field - it's what you'll see in linked records
- **Certification Level** determines which games a referee can work
- **Status** helps filter active referees vs those on leave
- The "Games" fields are automatically populated when you assign referees to games

---

## Table 2: CLUBS

Soccer clubs and organizations that host games.

| Field Name | Type | Required | Options/Format | Description |
|------------|------|----------|----------------|-------------|
| **Club ID** | Autonumber | Auto | Starts at 1 | Unique identifier for each club |
| **Club Name** | Single line text | Yes | - | Name of the club (PRIMARY FIELD) |
| **Assignor** | Single line text | No | - | Name of person assigning games |
| **Assignor Email** | Email | No | - | Assignor contact email |
| **Assignor Phone** | Phone number | No | - | Assignor contact phone |
| **Region** | Single select | No | North, South, East, West, Central | Geographic region (customize as needed) |
| **Referees** | Link to Referees | No | Multiple | Referees working for this club |
| **Fields** | Link to Fields | No | Multiple | Fields owned/managed by club |
| **Games** | Link to Games | No | Multiple | Games hosted by this club |
| **Payment Method** | Single select | No | Cash on Site, Check, Venmo, Zelle, Other | How the club pays referees |
| **Payment Notes** | Long text | No | - | Venmo handle, who to make check out to, etc. |
| **Notes** | Long text | No | - | Additional club information |

### Usage Notes:
- **Assignor** information helps route communications
- **Region** is useful for geographic filtering
- Add/modify regions to match your area
- **Payment Method** tracks how each club pays referees
- **Payment Notes** captures details like Venmo handles or check payee name

---

## Table 3: FIELDS (Locations)

Game locations and facilities.

| Field Name | Type | Required | Options/Format | Description |
|------------|------|----------|----------------|-------------|
| **Field ID** | Autonumber | Auto | Starts at 1 | Unique identifier for each field |
| **Field Name** | Single line text | Yes | - | Name of field, e.g., "Rye Field 1" (PRIMARY FIELD) |
| **Address** | Single line text | No | - | Street address |
| **City** | Single line text | No | - | City |
| **State** | Single line text | No | - | State or province |
| **Zip Code** | Single line text | No | - | Zip or postal code |
| **Club** | Link to Clubs | No | Single | Club that manages this field |
| **GPS Coordinates** | Single line text | No | "lat,long" format | For mapping integration |
| **Parking Notes** | Long text | No | - | Parking information for referees |
| **Field Notes** | Long text | No | - | Surface type, size, amenities |
| **Games** | Link to Games | No | Multiple | Games scheduled at this field |

### Usage Notes:
- **Field Name** should be clear and unique (avoid just "Field 1")
- Use full address for GPS/mapping tools
- **Parking Notes** are helpful for visiting referees
- **Field Notes** can include: grass/turf, field dimensions, locker rooms, etc.

---

## Table 4: GAMES

Scheduled games and referee assignments.

| Field Name | Type | Required | Options/Format | Description |
|------------|------|----------|----------------|-------------|
| **Game ID** | Autonumber | Auto | Starts at 1 | Unique identifier (PRIMARY FIELD) |
| **Date** | Date | Yes | Date only | Game date |
| **Time** | Single line text | Yes | e.g., "10:00 AM" | Game time |
| **Field** | Link to Fields | No | Single | Game location |
| **Home Team** | Single line text | No | - | Home team name |
| **Away Team** | Single line text | No | - | Away team name |
| **Age Group** | Single select | No | U8-U19 | Age group/division |
| **Division** | Single select | No | Recreational, Travel, Premier, Elite | Competition level |
| **Center Ref** | Link to Referees | No | Single | Assigned center referee |
| **AR1** | Link to Referees | No | Single | Assigned assistant referee 1 |
| **AR2** | Link to Referees | No | Single | Assigned assistant referee 2 |
| **Club** | Link to Clubs | No | Single | Hosting club |
| **Game Status** | Single select | No | Scheduled, Confirmed, Completed, Cancelled | Current status |
| **Payment Status** | Single select | No | Pending, Paid, Invoiced | Payment tracking |
| **Notes** | Long text | No | - | Special instructions |

### Usage Notes:
- **Time** field is text to allow flexibility ("TBD", "10:00 AM", etc.)
- Leave referee fields blank until assigned
- Use **Game Status** to track lifecycle
- **Payment Status** helps with referee payments

### Recommended Views:
1. **Unassigned Games** - Filter: `{Center Ref} = BLANK()`
2. **This Weekend** - Filter: Date within next 7 days
3. **By Field** - Group by: Field
4. **Need Payment** - Filter: `{Payment Status} = 'Pending'`

---

## Table 5: AVAILABILITY

Referee availability submissions from the web form.

| Field Name | Type | Required | Options/Format | Description |
|------------|------|----------|----------------|-------------|
| **Submission ID** | Autonumber | Auto | Starts at 1 | Unique identifier (PRIMARY FIELD) |
| **Referee** | Link to Referees | No | Single | Link to referee record |
| **Referee Name** | Single line text | Yes | - | Name from form |
| **Referee Email** | Email | Yes | - | Email from form |
| **Referee Phone** | Phone number | No | - | Phone from form |
| **Certification Level** | Single select | No | Grade 8-National | Certification level |
| **Date** | Date | Yes | Date only | Date available |
| **Start Time** | Single line text | No | e.g., "08:00 AM" | Start of availability window |
| **End Time** | Single line text | No | e.g., "05:00 PM" | End of availability window |
| **Preferred Locations** | Multiple select | No | List of locations | Willing to travel to |
| **Positions Willing** | Multiple select | No | Center, AR1, AR2, 4th Official | Positions qualified for |
| **Age Groups Preferred** | Multiple select | No | Age ranges | Preferred age groups |
| **Travel Distance** | Number | No | Integer | Max miles willing to travel |
| **Notes** | Long text | No | - | Additional info from referee |
| **Status** | Single select | No | New, Reviewed, Assigned, Archived | Processing status |
| **Submitted At** | Created time | Auto | Timestamp | When form was submitted |

### Usage Notes:
- **Referee Name/Email/Phone** are captured directly from the form
- **Referee** field should be manually linked to existing referee records (or use automation)
- **Preferred Locations** should match your field cities - update the form if you add new locations
- **Status** workflow: New → Reviewed → Assigned → Archived
- **Submitted At** automatically records timestamp

### Recommended Views:
1. **New Submissions** - Filter: `{Status} = 'New'`, Sort: Submitted At (newest first)
2. **By Date** - Group by: Date, Sort: Date ascending
3. **This Weekend Available** - Filter: Date is this week
4. **Unprocessed** - Filter: `{Status} = 'New' OR {Status} = 'Reviewed'`

### Filtering for Assignment:
Example: Find referees for Saturday game at Rye, U14, Center position
```
Filters:
- Date = [specific Saturday]
- Preferred Locations contains "Rye" OR "Any Location"
- Positions Willing contains "Center Referee"
- Age Groups Preferred contains "U13-U14" OR "Any Age Group"
- Status ≠ "Archived"
```

---

## Field Type Reference

### Common Field Types Used:

**Autonumber**
- Automatically generates sequential numbers
- Cannot be edited manually
- Useful for IDs

**Single line text**
- Short text (up to 100,000 characters)
- Good for names, titles, short descriptions

**Email**
- Validates email format
- Can click to send email

**Phone number**
- Accepts various phone formats
- Can click to call (on mobile)

**Single select**
- Choose one option from dropdown
- Can add/edit options anytime
- Good for categories, statuses

**Multiple select**
- Choose multiple options
- Displays as colored tags
- Good for locations, positions, age groups

**Number**
- Numeric values only
- Can set precision, format
- Use for distances, counts, amounts

**Date**
- Date picker
- Can include or exclude time
- Useful for scheduling

**Long text**
- Multi-line text
- Good for notes, descriptions
- Supports rich text formatting

**Link to another record**
- Creates relationships between tables
- Can be single or multiple links
- Automatically creates reverse link

**Created time**
- Automatically records when record was created
- Cannot be edited
- Useful for tracking submissions

---

## Customization Tips

### Adding New Locations:
1. Edit `referee-availability-form.html`
2. Add checkbox for new location
3. Update **Preferred Locations** field in Airtable Availability table
4. Add new option with same name

### Adding New Age Groups:
1. Update **Age Group** options in Games table
2. Update **Age Groups Preferred** options in Availability table
3. Optionally update form checkboxes

### Adding Custom Fields:
1. Add field to appropriate Airtable table
2. Update form HTML to capture the data
3. Update `js/form-handler.js` to include in submission
4. Test thoroughly

---

## Data Relationships Explained

### How Tables Connect:

```
REFEREES ←→ CLUBS (many-to-many)
   ↓ (one-to-many)
AVAILABILITY

CLUBS → FIELDS → GAMES
             ↑
          REFEREES (assigned to games)
```

- **Referees** can work for multiple **Clubs**
- **Clubs** can have multiple **Referees**
- **Clubs** manage multiple **Fields**
- **Fields** host multiple **Games**
- **Games** are assigned **Referees** (Center, AR1, AR2)
- **Referees** submit multiple **Availability** records

This structure allows you to:
- See all games at a specific field
- See all games a referee is assigned to
- Find all referees working for a club
- Track all availability submissions by a referee

---

## Best Practices

1. **Keep data clean**: Use consistent naming (capitalize consistently, avoid typos)
2. **Link records**: Always link Availability submissions to Referee records when possible
3. **Update statuses**: Keep Status fields current (Game Status, Payment Status, etc.)
4. **Use views**: Create custom views for common scenarios
5. **Regular cleanup**: Archive old availability submissions periodically
6. **Backup**: Use Airtable's backup features or export CSV regularly

---

## Need Help?

- Airtable Field Types Guide: https://support.airtable.com/hc/en-us/articles/360055885353
- Linking Records: https://support.airtable.com/hc/en-us/articles/360042312153
- Creating Views: https://support.airtable.com/hc/en-us/articles/202624989
