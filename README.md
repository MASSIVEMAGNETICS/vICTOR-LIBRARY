# TabTimeMachine

**Automatic browser session capture with PDF generation for Chrome and Edge**

TabTimeMachine is a Manifest V3 browser extension that automatically captures your browser sessions every 30 minutes (configurable), saving:
- Tab metadata (URLs, titles, positions, etc.) as JSON
- PDF snapshots of each tab (or merged into one PDF)

All data is saved to a local folder of your choice via a native messaging host.

## Features

- ⏰ **Automatic Capture**: Captures sessions every 30 minutes by default
- 📸 **Manual Snapshot**: Capture your current session on-demand
- 📄 **PDF Generation**: Create PDFs of all tabs using Chrome's debugger API
- 🔄 **Resume Support**: Automatically catches up if browser was closed for >35 minutes
- 🎯 **Flexible Options**: Configure interval, output folder, PDF mode, and more
- 🔒 **Incognito Support**: Optional capture of incognito tabs
- 💾 **Atomic Writes**: Safe file writing with no data loss

## Installation

### Prerequisites

- Windows 10 or later
- Google Chrome or Microsoft Edge (latest version)
- Python 3.7 or later (for building the native host)
- PyInstaller (will be installed automatically)

### Step 1: Build the Native Host

1. Open a Command Prompt or PowerShell
2. Navigate to the `native-host` directory:
   ```
   cd native-host
   ```
3. Run the build script:
   ```
   build.bat
   ```
   This will:
   - Install PyInstaller if needed
   - Build `tabtimemachine_host.exe`

### Step 2: Load the Extension

#### For Chrome:
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `vICTOR-LIBRARY` directory (the one containing `manifest.json`)
5. **Copy the Extension ID** (shown under the extension name)

#### For Edge:
1. Open Edge and go to `edge://extensions/`
2. Enable "Developer mode" (toggle in left sidebar)
3. Click "Load unpacked"
4. Select the `vICTOR-LIBRARY` directory (the one containing `manifest.json`)
5. **Copy the Extension ID** (shown under the extension name)

### Step 3: Install the Native Host

1. Open a Command Prompt as **Administrator** (right-click → Run as administrator)
2. Navigate to the `native-host` directory
3. Run the install script:
   ```
   install.bat
   ```
4. When prompted, paste the **Extension ID** you copied in Step 2
5. The script will register the native host for both Chrome and Edge

### Step 4: Configure the Extension

1. Right-click the extension icon in your browser and select "Options"
2. Click "Browse..." to select an output folder for your session captures
3. Configure other settings as desired:
   - **Capture Interval**: How often to capture (in minutes)
   - **PDF Mode**: Separate PDF per tab or one merged PDF
   - **Include incognito tabs**: Whether to capture incognito windows
4. Click "Save Settings"

## Usage

### Automatic Capture

Once configured, TabTimeMachine will automatically:
- Capture your browser session every N minutes (default: 30)
- Save tab metadata to `{timestamp}_session.json`
- Generate PDFs for each tab (or one merged PDF)
- Resume capturing after browser restart (with catch-up if >35 minutes)

### Manual Snapshot

To capture immediately:
1. Open the extension options (right-click icon → Options)
2. Click the "📸 Snapshot Now" button

### Output Files

Files are saved to your configured output folder with the format:
- `{timestamp}_session.json` - Tab metadata
- `{timestamp}_tab{id}_{title}.pdf` - Individual tab PDFs (per-tab mode)
- `{timestamp}_merged.pdf` - Single merged PDF (merged mode)

Where `{timestamp}` is Unix timestamp in milliseconds.

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Output Folder | Where to save session files | (must be set) |
| Capture Interval | Minutes between captures | 30 |
| PDF Mode | Per-tab or merged PDFs | Per-tab |
| Include Incognito | Capture incognito windows | Off |

## Smoke Test

### Basic Functionality Test

1. **Install and Configure**:
   - Follow all installation steps above
   - Set an output folder
   - Save settings

2. **Test Manual Capture**:
   - Open 3-4 different web pages
   - Click "📸 Snapshot Now"
   - Check your output folder for:
     - One JSON file with session data
     - Multiple PDF files (one per tab)
   - Verify JSON contains correct tab data
   - Verify PDFs open and show page content

3. **Test Automatic Capture**:
   - Set capture interval to 1 minute (for testing)
   - Save settings
   - Wait 1 minute
   - Check output folder for new files
   - Restore interval to 30 minutes

4. **Test Resume/Catch-up**:
   - Note the current time
   - Close your browser completely
   - Wait 40 minutes (or adjust system time forward 40 minutes)
   - Reopen browser
   - Within a few seconds, check output folder
   - You should see a new capture (catch-up triggered)

5. **Test PDF Modes**:
   - Try "Per-tab" mode: Should create separate PDFs
   - Try "Merged" mode: Should create one combined PDF
   - Verify both modes work correctly

6. **Test Incognito** (optional):
   - Open an incognito window with a tab
   - Disable "Include incognito tabs"
   - Capture: incognito tab should not appear
   - Enable "Include incognito tabs"
   - Capture: incognito tab should appear

### Expected Behavior

✅ Extension icon appears in toolbar
✅ Options page opens and saves settings
✅ Manual capture creates files immediately
✅ Automatic capture runs on schedule
✅ Files are written atomically (no .tmp files left over)
✅ PDFs contain readable page content
✅ JSON contains accurate tab metadata
✅ Catch-up works after extended downtime

### Common Issues

**"Native host has exited" error**:
- Verify native host is built and installed correctly
- Check Extension ID matches in manifest
- Run `install.bat` again with correct Extension ID

**PDFs are empty or blank**:
- Some pages block debugging
- System pages (chrome://, edge://) cannot be captured
- Try with regular web pages (google.com, github.com, etc.)

**No automatic captures**:
- Check output folder is set
- Verify browser stays open for full interval
- Check browser console for errors

**Folder selection doesn't work**:
- Verify native host is running
- Check Windows registry entries exist
- Try running browser as administrator

## Architecture

### Extension Components

- **manifest.json**: MV3 manifest with required permissions
- **background.js**: Service worker handling timers, capture logic, PDF generation
- **options.html/js**: Configuration UI

### Native Host

- **tabtimemachine_host.py**: Python script handling file I/O and folder selection
- **tabtimemachine_host.exe**: Compiled executable (built with PyInstaller)
- **com.tabtimemachine.host.json**: Native messaging manifest

### Data Flow

1. Timer triggers in background service worker
2. Extension queries all tabs and metadata
3. Extension uses chrome.debugger to generate PDFs
4. Extension sends JSON + base64 PDFs to native host
5. Native host writes files atomically to disk
6. Extension updates last capture timestamp

## Development

### Project Structure

```
vICTOR-LIBRARY/
├── manifest.json           # Extension manifest
├── background.js           # Service worker
├── options.html           # Options UI
├── options.js             # Options logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── native-host/           # Native messaging host
│   ├── tabtimemachine_host.py
│   ├── build.bat
│   ├── install.bat
│   └── com.tabtimemachine.host.json
└── README.md             # This file
```

### Debugging

- **Extension logs**: Open browser DevTools → Console
- **Background worker**: Go to `chrome://extensions/` → Click "service worker"
- **Native host**: Add logging to `tabtimemachine_host.py`

### Rebuilding

After changes to `tabtimemachine_host.py`:
1. Run `build.bat` to rebuild the executable
2. Restart browser to reload extension

## Security & Privacy

- All data stays local on your machine
- No external network requests
- PDFs generated using browser's built-in API
- Files written with atomic operations
- Extension requires explicit permissions

## License

[Add your license here]

## Support

For issues or questions:
1. Check the smoke test section above
2. Review common issues
3. Open an issue on GitHub

## Credits

Built with:
- Chrome Extension Manifest V3
- Chrome Debugger API (Page.printToPDF)
- Native Messaging API
- Python + PyInstaller