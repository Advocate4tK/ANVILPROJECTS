@echo off
REM Create config.js from template
REM Windows batch file

echo ========================================
echo   Referee Scheduling System
echo   Configuration Setup
echo ========================================
echo.

if exist config.js (
    echo WARNING: config.js already exists!
    echo.
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Cancelled. Existing config.js preserved.
        pause
        exit /b
    )
)

echo Copying config.template.js to config.js...
copy config.template.js config.js >nul

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS!
    echo ========================================
    echo.
    echo config.js has been created!
    echo.
    echo NEXT STEPS:
    echo 1. Open config.js in a text editor
    echo 2. Replace 'your_api_key_here' with your Airtable API token
    echo 3. Replace 'your_base_id_here' with your Airtable Base ID
    echo 4. Save the file
    echo.
    echo Need help getting credentials?
    echo - See SETUP_GUIDE.md Section 6
    echo - Or see QUICK_START.md
    echo.
    echo ========================================
) else (
    echo.
    echo ERROR: Failed to create config.js
    echo Please copy config.template.js manually.
)

echo.
pause
