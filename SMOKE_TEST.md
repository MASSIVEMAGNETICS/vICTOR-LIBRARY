# TabTimeMachine Smoke Test Checklist

Use this checklist to verify all features work correctly.

## Prerequisites
- [ ] Extension loaded in Chrome or Edge
- [ ] Native host built (`build.bat` completed)
- [ ] Native host installed (`install.bat` completed with Extension ID)
- [ ] Python 3.7+ installed

## Test 1: Basic Setup
**Goal**: Verify extension loads and options work

1. [ ] Extension icon appears in browser toolbar
2. [ ] Right-click icon → Options opens the settings page
3. [ ] All settings are visible:
   - [ ] Output folder selector
   - [ ] Capture interval input
   - [ ] PDF mode dropdown
   - [ ] Incognito checkbox
4. [ ] Click "Browse..." button
5. [ ] Folder selection dialog appears
6. [ ] Select a test folder
7. [ ] Folder path displays in UI
8. [ ] Click "Save Settings"
9. [ ] Success message appears

**Result**: ✅ Pass / ❌ Fail

## Test 2: Manual Snapshot
**Goal**: Test immediate capture functionality

**Setup**:
1. Open 3-4 test web pages:
   - google.com
   - github.com
   - wikipedia.org
   - Any other normal website (not chrome:// or edge://)

**Test Steps**:
1. [ ] Go to extension Options
2. [ ] Click "📸 Snapshot Now" button
3. [ ] Button shows "Capturing..." state
4. [ ] Wait 5-10 seconds
5. [ ] Check output folder for files:
   - [ ] `{timestamp}_session.json` exists
   - [ ] Multiple `{timestamp}_tab*.pdf` files exist (one per tab)
6. [ ] Open JSON file and verify:
   - [ ] Contains "timestamp" field
   - [ ] Contains "tabs" array
   - [ ] Tabs array has correct number of entries
   - [ ] Each tab has url, title, windowId fields
7. [ ] Open a PDF file:
   - [ ] PDF opens successfully
   - [ ] PDF contains page content (not blank)
   - [ ] Content matches one of your open tabs

**Result**: ✅ Pass / ❌ Fail

## Test 3: Per-Tab PDF Mode
**Goal**: Verify separate PDFs are created per tab

1. [ ] Open 3 test web pages
2. [ ] Options → Set PDF Mode to "Separate PDF per tab"
3. [ ] Save Settings
4. [ ] Click "Snapshot Now"
5. [ ] Check output folder:
   - [ ] One JSON file created
   - [ ] 3 separate PDF files created
   - [ ] Each PDF filename contains tab ID and title
   - [ ] Each PDF has different content

**Result**: ✅ Pass / ❌ Fail

## Test 4: Merged PDF Mode
**Goal**: Verify single merged PDF is created

1. [ ] Open 3 test web pages
2. [ ] Options → Set PDF Mode to "Single merged PDF"
3. [ ] Save Settings
4. [ ] Click "Snapshot Now"
5. [ ] Check output folder:
   - [ ] One JSON file created
   - [ ] One `{timestamp}_merged.pdf` file created
   - [ ] Merged PDF contains multiple pages

**Result**: ✅ Pass / ❌ Fail

## Test 5: Automatic Capture
**Goal**: Verify timer-based capture works

**Setup**:
1. [ ] Set capture interval to 1 minute (for testing)
2. [ ] Save Settings
3. [ ] Open browser console (F12) on a tab
4. [ ] Go to chrome://extensions/ (or edge://extensions/)
5. [ ] Click "service worker" under TabTimeMachine
6. [ ] Note the background worker console

**Test Steps**:
1. [ ] Wait 1 minute
2. [ ] Check console logs for "Capturing session..."
3. [ ] Check output folder for new files
4. [ ] New JSON and PDF files created
5. [ ] Files have different timestamps
6. [ ] Wait another minute
7. [ ] Another set of files created

**Cleanup**:
1. [ ] Set capture interval back to 30 minutes
2. [ ] Save Settings

**Result**: ✅ Pass / ❌ Fail

## Test 6: Resume and Catch-up
**Goal**: Verify catch-up after >35 minutes downtime

**Method A** (Recommended):
1. [ ] Note current timestamp
2. [ ] Close browser completely
3. [ ] Wait 40 minutes (go do something else)
4. [ ] Reopen browser
5. [ ] Check background worker logs immediately
6. [ ] Should see "Catch-up needed, capturing session now"
7. [ ] Check output folder
8. [ ] New capture files created shortly after startup

**Method B** (If you can't wait 40 minutes):
1. [ ] Open browser DevTools on background worker
2. [ ] Execute: `chrome.storage.local.set({lastCaptureTime: Date.now() - 40*60*1000})`
3. [ ] Close and reopen browser
4. [ ] Check for catch-up behavior

**Result**: ✅ Pass / ❌ Fail

## Test 7: Incognito Mode
**Goal**: Test incognito tab handling

**Without Incognito**:
1. [ ] Options → Uncheck "Include incognito tabs"
2. [ ] Save Settings
3. [ ] Open incognito window with 1-2 tabs
4. [ ] Open normal window with 2-3 tabs
5. [ ] Click "Snapshot Now"
6. [ ] Check JSON file
7. [ ] Only normal tabs are captured (no incognito tabs)

**With Incognito**:
1. [ ] Options → Check "Include incognito tabs"
2. [ ] Save Settings
3. [ ] Keep incognito window with tabs open
4. [ ] Click "Snapshot Now"
5. [ ] Check JSON file
6. [ ] Both normal and incognito tabs captured
7. [ ] Incognito tabs have `"incognito": true`

**Result**: ✅ Pass / ❌ Fail

## Test 8: Edge Cases
**Goal**: Test error handling

**System Pages**:
1. [ ] Open chrome://extensions/ or edge://extensions/
2. [ ] Click "Snapshot Now"
3. [ ] Check console - should skip system pages
4. [ ] No errors thrown
5. [ ] Other tabs still captured

**Empty Tabs**:
1. [ ] Close all tabs
2. [ ] Click "Snapshot Now"
3. [ ] Check console - should log "No tabs to capture"
4. [ ] No crash or error

**No Output Folder**:
1. [ ] Clear output folder setting: `chrome.storage.local.set({outputFolder: ''})`
2. [ ] Click "Snapshot Now"
3. [ ] Check console - should warn "Output folder not set"
4. [ ] No files created, no crash

**Result**: ✅ Pass / ❌ Fail

## Test 9: Atomic File Writing
**Goal**: Verify no .tmp files left behind

1. [ ] Click "Snapshot Now"
2. [ ] Immediately check output folder (while capturing)
3. [ ] May briefly see `.{filename}.tmp` files
4. [ ] Wait for capture to complete
5. [ ] Check output folder again
6. [ ] No .tmp files remaining
7. [ ] Only final .json and .pdf files exist

**Result**: ✅ Pass / ❌ Fail

## Test 10: Native Host Communication
**Goal**: Verify extension <-> native host works

1. [ ] Click "Browse..." button
2. [ ] Folder dialog appears (native host responding)
3. [ ] Select a folder
4. [ ] Folder path updates in UI
5. [ ] Click "Snapshot Now"
6. [ ] Files appear in selected folder
7. [ ] No "Native host has exited" errors

**If errors occur**:
- [ ] Check Extension ID matches in install.bat
- [ ] Verify registry entries exist:
  - `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.tabtimemachine.host`
  - `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.tabtimemachine.host`
- [ ] Run install.bat again as Administrator

**Result**: ✅ Pass / ❌ Fail

## Overall Results

**Tests Passed**: __ / 10

**Critical Issues**: _______________________

**Notes**: _______________________

---

## Troubleshooting Guide

### "Native host has exited"
- Reinstall: Run `install.bat` with correct Extension ID
- Check: Registry entries exist
- Verify: `tabtimemachine_host.exe` exists in native-host folder

### PDFs are blank/empty
- System pages (chrome://, edge://) cannot be captured
- Try regular websites (google.com, github.com)
- Check if page allows debugging

### No automatic captures
- Verify output folder is set
- Check capture interval is correct
- Browser must stay open for timer to work
- Check background worker console for errors

### Folder selection doesn't work
- Native host must be installed correctly
- Run browser as Administrator and try again
- Check native host build completed successfully

### Can't find background worker console
- Chrome: chrome://extensions/ → find TabTimeMachine → click "service worker"
- Edge: edge://extensions/ → find TabTimeMachine → click "service worker"
- Must have at least one tab open for service worker to be active
