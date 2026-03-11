# Deployment Checklist

Use this checklist to ensure everything is configured correctly before deploying.

## Pre-Deployment Checklist

### ✅ Airtable Setup

- [ ] Airtable account created
- [ ] Base "Referee Scheduling" created
- [ ] All 5 tables created:
  - [ ] Referees
  - [ ] Clubs
  - [ ] Fields
  - [ ] Games
  - [ ] Availability
- [ ] All fields added to each table (see SETUP_GUIDE.md)
- [ ] Table relationships configured (links between tables)
- [ ] Personal Access Token created with correct permissions:
  - [ ] `data.records:read` permission enabled
  - [ ] `data.records:write` permission enabled
  - [ ] Token has access to "Referee Scheduling" base
- [ ] Base ID obtained from API documentation
- [ ] Token and Base ID securely saved

### ✅ Application Configuration

- [ ] `config.template.js` copied to `config.js`
- [ ] API Key added to config.js
- [ ] Base ID added to config.js
- [ ] Table names in config.js match Airtable exactly (case-sensitive)
- [ ] config.js added to .gitignore (if using version control)

### ✅ Customization (Optional)

- [ ] Location list customized for your area
- [ ] Age groups updated if needed
- [ ] Club regions configured
- [ ] Form styling adjusted (logo, colors, etc.)
- [ ] Contact information updated

### ✅ Local Testing

- [ ] Opened index.html in web browser
- [ ] Navigation works (can click to form)
- [ ] Form displays correctly on desktop
- [ ] Form displays correctly on mobile (test with browser dev tools)
- [ ] All form fields appear properly
- [ ] Form validation works (try submitting empty form)
- [ ] Test submission successful
- [ ] Data appears in Airtable Availability table
- [ ] All fields populated correctly in Airtable
- [ ] No console errors (check browser dev tools F12)

### ✅ Sample Data

- [ ] Added at least 2 sample referees
- [ ] Added at least 1 sample club
- [ ] Added at least 2 sample fields
- [ ] Added at least 1 sample game
- [ ] Tested assigning referee to game
- [ ] Tested linking between tables

### ✅ Security Review

- [ ] API key not exposed in public code
- [ ] config.js not committed to public repository
- [ ] Considered using backend proxy for production (optional but recommended)
- [ ] Decided on public vs. private deployment
- [ ] Backup of API credentials stored securely

## Deployment Checklist

### ✅ Choose Deployment Method

Select one:
- [ ] Netlify (recommended for easiest)
- [ ] Vercel
- [ ] GitHub Pages (requires Git)
- [ ] Traditional web hosting (FTP/cPanel)
- [ ] AWS S3
- [ ] Other: _______________

### ✅ Deploy Files

- [ ] All HTML files included
- [ ] All CSS files included (css folder)
- [ ] All JavaScript files included (js folder)
- [ ] config.js included (with credentials)
- [ ] Documentation files included (README, guides)
- [ ] Airtable folder included (optional but helpful)

### ✅ Post-Deployment Testing

- [ ] Visit deployed URL
- [ ] Home page loads correctly
- [ ] No broken links
- [ ] No 404 errors for CSS/JS files
- [ ] Form page loads
- [ ] Form styling looks correct
- [ ] Mobile view works properly
- [ ] Submit test availability
- [ ] Verify submission appears in Airtable
- [ ] Test from different browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
  - [ ] Mobile Safari (iOS)
  - [ ] Mobile Chrome (Android)

### ✅ Custom Domain (Optional)

- [ ] Domain purchased/available
- [ ] DNS records configured
- [ ] CNAME or A record added
- [ ] SSL/HTTPS enabled
- [ ] Domain propagated (can take 24-48 hours)
- [ ] Tested with custom domain

## Post-Launch Checklist

### ✅ Documentation

- [ ] Internal documentation created for admins
- [ ] Instructions shared with assignors
- [ ] Help guide created for referees
- [ ] Contact person designated for issues

### ✅ Communication

- [ ] URL shared with referee community
- [ ] Instructions sent to referees
- [ ] Assignors trained on Airtable
- [ ] Launch announcement sent
- [ ] Feedback channel established

### ✅ Monitoring

- [ ] Check Airtable daily for new submissions (first week)
- [ ] Monitor for error reports
- [ ] Track usage/adoption
- [ ] Collect user feedback

### ✅ Backup & Maintenance

- [ ] Initial backup of Airtable data created
- [ ] Backup schedule established (recommend weekly)
- [ ] Update schedule planned (e.g., monthly)
- [ ] Responsible person assigned for maintenance

## One Week Post-Launch

- [ ] Review submission data quality
- [ ] Address any user issues
- [ ] Make adjustments based on feedback
- [ ] Archive test submissions
- [ ] Update documentation if needed
- [ ] Consider adding requested features

## One Month Post-Launch

- [ ] Full system review
- [ ] User satisfaction survey
- [ ] Performance analysis
- [ ] Plan enhancements
- [ ] Update training materials
- [ ] Celebrate success! 🎉

---

## Emergency Contacts

**Technical Issues:**
- Deployment platform support: _______________
- Airtable support: https://support.airtable.com

**Internal Contacts:**
- System administrator: _______________
- Lead assignor: _______________
- Technical contact: _______________

---

## Rollback Plan

If something goes wrong:

1. **Take system offline** (if critical):
   - Remove deployment or show maintenance page
   - Alert users via email/text

2. **Identify issue**:
   - Check browser console for errors
   - Review Airtable API logs
   - Test locally

3. **Fix or revert**:
   - Fix the issue if simple
   - Revert to previous version from backup
   - Redeploy working version

4. **Verify fix**:
   - Test thoroughly before relaunching
   - Do end-to-end testing

5. **Communicate**:
   - Alert users when system is back online
   - Explain what happened (if appropriate)

---

## Notes

Use this space for deployment-specific notes:

**Deployment Date:** _______________

**Deployed URL:** _______________

**Deployment Method:** _______________

**Team Members:**
- _______________
- _______________
- _______________

**Known Issues:**
- _______________
- _______________

**Future Enhancements:**
- _______________
- _______________

---

## Success Metrics

Track these after launch:

- **Week 1:**
  - Submissions: _______
  - Unique referees: _______
  - Games assigned: _______

- **Month 1:**
  - Total submissions: _______
  - Active referees: _______
  - Games assigned: _______
  - User satisfaction: _______/10

---

**Deployment completed by:** _______________

**Date:** _______________

**Sign-off:** _______________

🎉 **Congratulations on your deployment!** 🎉
