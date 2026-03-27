# Deployment Guide

This guide shows you how to deploy your Referee Scheduling System to various hosting platforms.

## Prerequisites

Before deploying, make sure you have:
- ✅ Completed Airtable setup (see SETUP_GUIDE.md)
- ✅ Configured `config.js` with your API credentials
- ✅ Tested the form locally and confirmed data reaches Airtable

---

## Deployment Options

### Option 1: Netlify (Recommended - Easiest)

**Pros:** Free, instant deployment, drag-and-drop, automatic HTTPS
**Best for:** Quick deployment, non-technical users

#### Steps:

1. **Create a Netlify account** at https://www.netlify.com (free)

2. **Prepare your files:**
   - Make sure `config.js` has your API credentials
   - All files should be in the "referee tool" folder

3. **Drag and Drop Deploy:**
   - Go to https://app.netlify.com/drop
   - Drag the entire "referee tool" folder onto the page
   - Wait 30 seconds
   - Done! You'll get a URL like `https://random-name-12345.netlify.app`

4. **Custom Domain (Optional):**
   - In Netlify dashboard, go to "Domain settings"
   - Add your custom domain
   - Follow DNS configuration instructions

**⚠️ Security Note:** Your API key will be visible in the deployed `config.js`. For better security, see "Secure Deployment" section below.

---

### Option 2: GitHub Pages

**Pros:** Free, version control, easy updates
**Best for:** Developers familiar with Git

#### Steps:

1. **Create a GitHub account** at https://github.com (free)

2. **Create a new repository:**
   - Name it "referee-scheduling"
   - Make it **private** (to protect your API key)
   - Don't initialize with README

3. **Upload your files:**
   ```bash
   cd "referee tool"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/referee-scheduling.git
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to repository Settings
   - Scroll to "Pages"
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Click Save

5. **Access your site:**
   - URL: `https://YOUR_USERNAME.github.io/referee-scheduling/`
   - May take 5-10 minutes for first deployment

**⚠️ Security Note:** Keep repository private to protect your API key.

---

### Option 3: Vercel

**Pros:** Fast, free, great performance, automatic HTTPS
**Best for:** Modern deployment with easy updates

#### Steps:

1. **Create a Vercel account** at https://vercel.com (free)

2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

3. **Deploy via Dashboard:**
   - Go to https://vercel.com/new
   - Drag and drop the "referee tool" folder
   - Click Deploy
   - Done! You'll get a URL like `https://referee-tool.vercel.app`

4. **Or Deploy via CLI:**
   ```bash
   cd "referee tool"
   vercel
   ```

---

### Option 4: Traditional Web Hosting (cPanel, FTP)

**Pros:** Works with existing web hosting
**Best for:** Organizations with existing web servers

#### Steps:

1. **Prepare files:**
   - ZIP the entire "referee tool" folder
   - Name it something like `referee-tool.zip`

2. **Upload via FTP:**
   - Use FileZilla or your hosting's File Manager
   - Upload to `public_html` or `www` directory
   - Extract the ZIP file

3. **Or use cPanel File Manager:**
   - Log into cPanel
   - Go to File Manager
   - Navigate to public_html
   - Click Upload
   - Upload your ZIP file
   - Extract it

4. **Access your site:**
   - URL: `https://yourdomain.com/referee-tool/`

---

### Option 5: AWS S3 (Static Website Hosting)

**Pros:** Scalable, reliable, cheap
**Best for:** Organizations using AWS

#### Steps:

1. **Create S3 bucket:**
   - Log into AWS Console
   - Go to S3
   - Create bucket named "referee-scheduling"
   - Uncheck "Block all public access"

2. **Upload files:**
   - Upload all files from "referee tool" folder
   - Make sure to upload folder structure intact

3. **Enable static website hosting:**
   - Go to bucket Properties
   - Static website hosting → Enable
   - Index document: `index.html`
   - Error document: `index.html`

4. **Set bucket policy:**
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [{
           "Sid": "PublicReadGetObject",
           "Effect": "Allow",
           "Principal": "*",
           "Action": "s3:GetObject",
           "Resource": "arn:aws:s3:::referee-scheduling/*"
       }]
   }
   ```

5. **Access your site:**
   - URL provided in Static website hosting settings
   - Example: `http://referee-scheduling.s3-website-us-east-1.amazonaws.com`

---

## Secure Deployment (Recommended for Production)

**Problem:** The `config.js` file contains your Airtable API key, which can be viewed by anyone.

**Solution:** Use a backend proxy to hide your API key.

### Option A: Netlify Functions (Serverless)

1. **Create a Netlify function:**

Create `netlify/functions/submit-availability.js`:
```javascript
const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);

    const response = await fetch(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Availability`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: data })
        }
    );

    const result = await response.json();
    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
};
```

2. **Set environment variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add `AIRTABLE_API_KEY`
   - Add `AIRTABLE_BASE_ID`

3. **Update your JavaScript to call the function instead of Airtable directly**

### Option B: Simple PHP Proxy

If your hosting supports PHP, create `submit.php`:
```php
<?php
header('Content-Type: application/json');

// Your API key (still on server, not exposed to client)
$apiKey = 'YOUR_API_KEY_HERE';
$baseId = 'YOUR_BASE_ID_HERE';

$data = json_decode(file_get_contents('php://input'), true);

$ch = curl_init("https://api.airtable.com/v0/$baseId/Availability");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['fields' => $data]));

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
```

---

## Testing Your Deployment

After deploying, test these:

1. **Form loads correctly**
   - Visit your deployed URL
   - Click "Referee Availability Form"
   - All fields appear properly

2. **Form submits successfully**
   - Fill out the form
   - Click Submit
   - Check for success message
   - Verify data appears in Airtable

3. **Mobile responsiveness**
   - Test on phone/tablet
   - Forms should be easy to use on small screens

4. **Multiple submissions**
   - Submit form 2-3 times with different data
   - Verify all submissions appear in Airtable

---

## Updating Your Deployed Site

### For Netlify (Drag & Drop):
1. Make changes to your local files
2. Drag and drop the folder again to Netlify
3. It will update the existing site

### For GitHub Pages:
```bash
git add .
git commit -m "Update form"
git push
```

### For Traditional Hosting:
1. Re-upload changed files via FTP
2. Overwrite existing files

---

## Custom Domain Setup

### For Netlify:
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `referees.yourclub.com`)
4. Follow DNS instructions:
   - Add CNAME record pointing to Netlify

### For GitHub Pages:
1. Go to repository Settings → Pages
2. Enter custom domain
3. Add CNAME record in your DNS:
   - `CNAME` → `YOUR_USERNAME.github.io`

---

## Troubleshooting

### "404 Not Found" after deployment
- Check that index.html is in the root directory
- Verify hosting is configured to serve static files

### Form submits but no data in Airtable
- Check browser console for errors (F12)
- Verify API key and Base ID are correct in config.js
- Check Airtable API token has write permissions

### "CORS Error" in browser
- If using a backend proxy, check CORS headers
- Direct Airtable API calls should work without CORS issues

### Styling looks broken
- Check that css/styles.css uploaded correctly
- Verify file paths are relative (no absolute paths)

### API key exposed
- Move to serverless function (see Secure Deployment)
- Regenerate your Airtable API token
- Update config.js with new token

---

## Performance Optimization

### Minify Files (Optional):
- CSS: Use https://cssminifier.com
- JavaScript: Use https://javascript-minifier.com
- Reduces file sizes for faster loading

### Add Caching Headers:
For Apache (`.htaccess`):
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

---

## Backup Your Deployment Package

Before deploying:
1. ZIP the entire "referee tool" folder
2. Save it as `referee-tool-backup-YYYY-MM-DD.zip`
3. Store it somewhere safe
4. This makes it easy to re-deploy or move to another server

---

## Next Steps After Deployment

1. ✅ Test form submission thoroughly
2. 📧 Share URL with your referee community
3. 📊 Monitor Airtable for new submissions
4. 🔄 Set up regular backups of your Airtable data
5. 📱 Add to home screen on mobile devices for easy access

---

## Support

If you run into deployment issues:
- Netlify Docs: https://docs.netlify.com
- Vercel Docs: https://vercel.com/docs
- GitHub Pages: https://docs.github.com/pages
- Airtable API: https://airtable.com/api
