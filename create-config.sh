#!/bin/bash
# Create config.js from template
# Mac/Linux shell script

echo "========================================"
echo "  Referee Scheduling System"
echo "  Configuration Setup"
echo "========================================"
echo ""

if [ -f "config.js" ]; then
    echo "WARNING: config.js already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Cancelled. Existing config.js preserved."
        exit 0
    fi
fi

echo "Copying config.template.js to config.js..."
cp config.template.js config.js

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  SUCCESS!"
    echo "========================================"
    echo ""
    echo "config.js has been created!"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Open config.js in a text editor"
    echo "2. Replace 'your_api_key_here' with your Airtable API token"
    echo "3. Replace 'your_base_id_here' with your Airtable Base ID"
    echo "4. Save the file"
    echo ""
    echo "Need help getting credentials?"
    echo "- See SETUP_GUIDE.md Section 6"
    echo "- Or see QUICK_START.md"
    echo ""
    echo "========================================"
else
    echo ""
    echo "ERROR: Failed to create config.js"
    echo "Please copy config.template.js manually."
fi

echo ""
