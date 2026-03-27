# Export & Transfer Instructions

This guide explains how to package and transfer this project to another computer.

---

## 📦 Method 1: ZIP File (Recommended)

### On This Computer:

1. **Close any open files** in the "referee tool" folder

2. **Create ZIP file**:

   **Windows:**
   - Right-click the "referee tool" folder
   - Select "Send to" → "Compressed (zipped) folder"
   - Name it: `referee-scheduling-system.zip`

   **Mac:**
   - Right-click the "referee tool" folder
   - Select "Compress referee tool"
   - Rename to: `referee-scheduling-system.zip`

   **Linux:**
   ```bash
   cd ~/
   zip -r referee-scheduling-system.zip "referee tool"
   ```

3. **Transfer the ZIP**:
   - USB drive
   - Email (if under 25MB)
   - Cloud storage (Dropbox, Google Drive, OneDrive)
   - File sharing service (WeTransfer, etc.)

### On the New Computer:

1. **Extract the ZIP file**:
   - Right-click the ZIP
   - Select "Extract All" (Windows) or "Open" (Mac)
   - Choose destination folder

2. **Follow setup** (see QUICK_START.md):
   - Set up Airtable (if not done)
   - Create config.js from template
   - Add credentials
   - Test locally
   - Deploy

---

## 📂 Method 2: Cloud Sync

### Using Google Drive, Dropbox, or OneDrive:

1. **Upload folder**:
   - Drag "referee tool" folder to your cloud storage
   - Wait for sync to complete

2. **On new computer**:
   - Download/sync the folder
   - Follow setup instructions

---

## 🔄 Method 3: Git Repository (For Developers)

### On This Computer:

1. **Initialize Git** (if not already done):
   ```bash
   cd "referee tool"
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub/GitLab**:
   ```bash
   # Create a PRIVATE repository on GitHub
   git remote add origin https://github.com/yourusername/referee-scheduling.git
   git branch -M main
   git push -u origin main
   ```

   **IMPORTANT**: Make sure repository is PRIVATE (contains API keys in config.js)

### On New Computer:

1. **Clone repository**:
   ```bash
   git clone https://github.com/yourusername/referee-scheduling.git
   ```

2. **Create config.js** (if not in repo):
   ```bash
   cd referee-scheduling
   cp config.template.js config.js
   # Edit config.js with credentials
   ```

---

## 💾 What to Include

### ✅ Always Include:
- All HTML files
- All CSS files (css folder)
- All JavaScript files (js folder)
- All documentation (.md files)
- config.template.js
- airtable folder (helpful reference)
- .gitignore
- LICENSE.txt
- Shell scripts (create-config.sh, create-config.bat)

### ⚠️ Optional (But Recommended):
- config.js (if moving to your own computer)
- Any customizations you've made

### ❌ Can Exclude:
- .git folder (if using Git)
- node_modules (none in this project)
- Any backup files (.bak, .backup)
- System files (.DS_Store, Thumbs.db)

---

## 🔐 Security Considerations

### If config.js Contains Your API Key:

**Option 1: Include it (Secure Transfer)**
- Use encrypted file transfer
- Delete from source after confirming transfer
- Only if transferring to your own computer

**Option 2: Exclude it (Safer)**
- Don't include config.js in ZIP
- Create new config.js on destination computer
- Use config.template.js as reference

**Option 3: Use Environment Variables (Most Secure)**
- Don't store credentials in files
- Set up environment variables on server
- Modify code to read from environment

---

## 📋 Transfer Checklist

Before transferring:
- [ ] All files saved
- [ ] Customizations documented
- [ ] config.js decision made (include or exclude)
- [ ] ZIP file created and tested
- [ ] Transfer method chosen

After transferring:
- [ ] All files extracted correctly
- [ ] Folder structure intact
- [ ] config.js created (if needed)
- [ ] Credentials added to config.js
- [ ] Local test successful
- [ ] Ready to deploy

---

## 🚀 Quick Transfer Guide

### Fastest Method (USB Drive):

1. **Plug in USB drive**
2. **Copy folder** to USB drive
3. **Eject safely**
4. **Plug into new computer**
5. **Copy from USB to new location**
6. **Set up config.js**
7. **Test and deploy**

**Time**: 5-10 minutes

---

## 📧 Transfer via Email

If the ZIP is small enough (<25MB for most email):

1. Create ZIP file
2. Compose new email
3. Attach ZIP file
4. Send to yourself or recipient
5. Download on new computer
6. Extract and set up

---

## ☁️ Transfer via Cloud Storage

### Google Drive:
1. Upload ZIP to Google Drive
2. Right-click → Get link
3. Share link (set permissions)
4. Download on new computer

### Dropbox:
1. Upload ZIP to Dropbox
2. Right-click → Share
3. Copy link
4. Download on new computer

### OneDrive:
1. Upload ZIP to OneDrive
2. Right-click → Share
3. Copy link
4. Download on new computer

---

## 🔍 Verify Transfer

After transferring, check:

1. **File count**: Should have ~20 files
2. **Folders**: css, js, airtable folders exist
3. **Main files**: index.html, referee-availability-form.html present
4. **Documentation**: All .md files present
5. **Open index.html**: Should load without errors

---

## 🆘 Troubleshooting

### "Files missing after extraction"
- Re-download ZIP file
- Try different extraction tool
- Check if antivirus quarantined files

### "ZIP file corrupted"
- Create new ZIP file
- Use different compression tool
- Try smaller file size (compress more)

### "Can't open HTML files"
- Right-click → Open with → Chrome/Firefox
- Or double-click to open in default browser

### "CSS/JS not loading"
- Check folder structure is intact
- Make sure css and js folders are in same directory as HTML files
- Check file paths are relative, not absolute

---

## 📊 Package Size

Expected package size:
- **Uncompressed**: ~200-300 KB
- **Compressed (ZIP)**: ~50-100 KB

Very small and easy to transfer!

---

## 🎯 After Transfer - Next Steps

1. **Extract files** to a permanent location
2. **Follow QUICK_START.md** for setup
3. **Create config.js** from template
4. **Add Airtable credentials**
5. **Test locally** by opening index.html
6. **Deploy** using DEPLOYMENT_GUIDE.md
7. **Share URL** with your referees

---

## 📞 Need Help?

If transfer issues occur:
1. Check file permissions
2. Try different transfer method
3. Verify ZIP integrity
4. Re-create ZIP from source

For setup after transfer:
- See QUICK_START.md
- See SETUP_GUIDE.md
- See DEPLOYMENT_GUIDE.md

---

## ✅ Transfer Complete!

Once transferred successfully:
- [ ] All files present
- [ ] Folder structure correct
- [ ] Documentation accessible
- [ ] Ready for configuration

**You're ready to set up on the new computer!** 🎉

---

**Last Updated**: March 2026
