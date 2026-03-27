# REF WEB PROJECT – Master Project Summary

## Project Location
C:\Users\Daddy\Desktop\REF WEB PROJECT

## System Overview
- Admin hub (admin.html)
- Club scheduling pages (HTML)
- Airtable backend
- Migrating to Supabase

## Login Flow
First-time users:
- Enter name, email, phone
- Profile created in Airtable
- Pass-through to scheduling

Admin:
- First: Admin
- Last: Admin
- Password: Referee33**
- Not stored in Airtable
- Must bypass setup

## Problem
- Admin cannot access all club pages
- Must piggyback on users

## Solution
- Admin pass-through JS
- sessionStorage used

## Next Steps
- Add admin-pass-through.js to all pages
- Continue Supabase migration
