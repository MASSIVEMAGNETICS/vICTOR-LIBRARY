# TabTimeMachine - Quick Start Guide

This guide will get you up and running with TabTimeMachine in under 10 minutes.

## Prerequisites Check

Before starting, make sure you have:
- [ ] Windows 10 or later
- [ ] Chrome or Edge browser
- [ ] Python 3.7+ installed (check with `python --version`)
- [ ] Command Prompt or PowerShell access

## Installation (5 minutes)

### 1. Build Native Host (2 minutes)

Open Command Prompt and run:
```bash
cd native-host
build.bat
```

Wait for the build to complete. You should see "Build complete!".

### 2. Load Extension (1 minute)

**Chrome:**
- Open `chrome://extensions/`
- Toggle "Developer mode" ON
- Click "Load unpacked"
- Select the project folder
- **Copy the Extension ID** (important!)

**Edge:**
- Open `edge://extensions/`
- Toggle "Developer mode" ON
- Click "Load unpacked"
- Select the project folder
- **Copy the Extension ID** (important!)

### 3. Install Native Host (1 minute)

Open Command Prompt **as Administrator**:
```bash
cd native-host
install.bat
```

When prompted, paste your Extension ID.

### 4. Configure Extension (1 minute)

- Right-click extension icon → Options
- Click "Browse..." to select output folder
- Click "Save Settings"

Done! 🎉

## First Capture (1 minute)

To verify everything works:

1. Open a few web pages (try google.com, github.com)
2. Open extension options
3. Click "📸 Snapshot Now"
4. Check your output folder for:
   - `{timestamp}_session.json`
   - `{timestamp}_tab*.pdf` files

If you see these files, everything is working! The extension will now automatically capture every 30 minutes.

## Troubleshooting

### Build fails
- Make sure Python is in your PATH
- Try: `pip install pyinstaller` manually

### "Native host has exited"
- Run `install.bat` again with correct Extension ID
- Make sure you ran as Administrator

### No files created
- Check output folder is set in Options
- Look at browser console (F12) for errors
- Try with non-system pages (not chrome:// or edge://)

## Next Steps

- Set your preferred capture interval (Options)
- Choose PDF mode (per-tab or merged)
- Enable incognito capture if needed
- Let it run in the background!

For detailed information, see the full [README.md](README.md).
