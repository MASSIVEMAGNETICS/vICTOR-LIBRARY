# Troubleshooting Guide for TabTimeMachine

## Common Issues and Solutions

### Installation Issues

#### Issue: "Python not found" when running build.bat
**Solution:**
1. Install Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart Command Prompt
4. Verify: `python --version`

#### Issue: "PyInstaller not found" during build
**Solution:**
```bash
pip install pyinstaller
```
Or let build.bat install it automatically.

#### Issue: Build.bat completes but no .exe file
**Solution:**
1. Check the `dist/` folder for the executable
2. build.bat should copy it automatically
3. Manual copy: `copy dist\tabtimemachine_host.exe .`

### Native Host Issues

#### Issue: "Native host has exited"
**Causes and Solutions:**

1. **Extension ID mismatch**:
   - Go to chrome://extensions/ or edge://extensions/
   - Find TabTimeMachine and copy Extension ID
   - Run `install.bat` again with correct ID

2. **Registry not updated**:
   - Open Command Prompt as Administrator
   - Run `install.bat` again
   - Verify registry entries exist (see below)

3. **Native host not built**:
   - Run `build.bat` first
   - Verify `tabtimemachine_host.exe` exists

**Verify Registry Entries:**
```
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabtimemachine.host"
reg query "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabtimemachine.host"
```

#### Issue: "Error: Unable to start native messaging host"
**Solution:**
1. Check manifest path is correct
2. Verify .exe has execute permissions
3. Try running .exe manually to check for errors:
   ```
   cd native-host
   tabtimemachine_host.exe
   ```
   (It should wait for input - this is normal. Press Ctrl+C to exit)

### Extension Issues

#### Issue: Extension not loading
**Solution:**
1. Check for errors on chrome://extensions/
2. Verify manifest.json is valid JSON
3. Try removing and re-adding the extension

#### Issue: Options page won't open
**Solution:**
1. Right-click extension icon → Options
2. Or go to chrome://extensions/ → TabTimeMachine → Details → Extension options

#### Issue: Settings not saving
**Solution:**
1. Check browser console (F12) for errors
2. Verify storage permissions in manifest.json
3. Try clearing extension data:
   ```javascript
   chrome.storage.local.clear()
   ```
   Then reconfigure settings

### PDF Generation Issues

#### Issue: PDFs are blank or empty
**Common Causes:**
1. **System pages**: Cannot capture chrome://, edge://, or extension:// pages
2. **Page not loaded**: Wait for page to fully load before capturing
3. **Content restrictions**: Some sites block debugging

**Solution:**
- Test with simple pages first: google.com, github.com, wikipedia.org
- Avoid system pages and internal browser pages
- Check console for specific error messages

#### Issue: "Cannot attach debugger" error
**Causes:**
1. Tab already has debugger attached
2. Tab is a system page
3. Multiple captures running simultaneously

**Solution:**
- Close DevTools on all tabs before capturing
- Skip system pages (extension does this automatically)
- Wait for previous capture to complete

#### Issue: PDFs missing some tabs
**Expected Behavior:**
- System pages (chrome://, edge://) are skipped automatically
- Extension pages cannot be captured
- This is by design and logged in console

### Capture Issues

#### Issue: No automatic captures happening
**Solutions:**
1. **Check output folder is set**:
   - Go to Options
   - Verify folder path is shown
   - Try setting it again

2. **Check timer is running**:
   - Open background worker console
   - Look for "Next capture scheduled" message
   - Should appear after extension starts

3. **Browser was closed**:
   - Service worker stops when browser closes
   - Will resume on next startup with catch-up if needed

4. **Interval too long**:
   - Check interval setting in Options
   - Default is 30 minutes
   - Try 1 minute for testing

#### Issue: Catch-up not working after restart
**Check:**
1. Extension reloaded properly on startup
2. lastCaptureTime was saved before shutdown
3. Check background worker console for "Catch-up needed" message

**Test Manually:**
```javascript
// In background worker console:
chrome.storage.local.get('lastCaptureTime', (result) => {
  console.log('Last capture:', new Date(result.lastCaptureTime));
});
```

### File System Issues

#### Issue: Files not appearing in output folder
**Solutions:**
1. **Check folder exists**: Browse to folder in Explorer
2. **Check permissions**: Ensure folder is writable
3. **Check native host**: See "Native host has exited" above
4. **Check console**: Look for native host errors

#### Issue: .tmp files left in folder
**Causes:**
- Capture was interrupted
- Native host crashed
- Browser closed during write

**Solution:**
- Safe to delete .tmp files manually
- Extension will retry on next capture

#### Issue: Cannot select output folder
**Solution:**
1. Verify native host is installed correctly
2. Check native host can run (see registry verification above)
3. Try running browser as Administrator
4. Check tkinter is available:
   ```
   python -c "import tkinter"
   ```

### Performance Issues

#### Issue: Browser becomes slow during capture
**Expected:**
- Slight slowdown during PDF generation
- Each tab takes ~1-2 seconds
- Should return to normal after capture

**If persistent:**
- Reduce capture frequency
- Use merged PDF mode (less I/O)
- Exclude incognito tabs if not needed

#### Issue: Large PDF files
**Solutions:**
- Normal for media-rich pages
- Consider per-tab mode to keep files manageable
- Periodically archive old captures

### Debugging Tips

#### View Extension Logs
1. Go to chrome://extensions/ or edge://extensions/
2. Find TabTimeMachine
3. Click "service worker" link
4. View console output

#### View Native Host Communication
Add logging to tabtimemachine_host.py:
```python
import sys
import logging

logging.basicConfig(
    filename='C:\\temp\\tabtimemachine.log',
    level=logging.DEBUG
)
```

#### Test Native Host Manually
```bash
cd native-host
echo {"action":"selectFolder"} | python tabtimemachine_host.py
```
Should return JSON with folder path.

#### Check Storage
In background worker console:
```javascript
chrome.storage.local.get(null, (data) => {
  console.log('All settings:', data);
});
```

### Windows-Specific Issues

#### Issue: "Access Denied" when running install.bat
**Solution:**
- Run Command Prompt as Administrator
- Right-click Command Prompt → "Run as administrator"

#### Issue: Windows Defender blocks .exe
**Solution:**
1. Windows Defender may flag unknown .exe files
2. Add exception for tabtimemachine_host.exe
3. Or build with proper code signing certificate

#### Issue: Path too long errors
**Solution:**
- Use shorter output folder path
- Enable long path support in Windows:
  ```
  reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
  ```

### Still Having Issues?

1. **Check the logs**:
   - Browser console (F12)
   - Background worker console
   - Native host logs (if enabled)

2. **Verify installation**:
   - Extension loaded and enabled
   - Native host built successfully
   - Registry entries exist
   - Extension ID matches in manifest

3. **Test components separately**:
   - Test extension without PDFs (check JSON only)
   - Test native host manually
   - Test PDF generation on single tab

4. **Clean reinstall**:
   ```
   1. Run uninstall.bat
   2. Remove extension from browser
   3. Delete and re-extract files
   4. Follow installation steps again
   ```

5. **Report an issue**:
   - Include browser version
   - Include Python version
   - Include error messages
   - Include steps to reproduce
