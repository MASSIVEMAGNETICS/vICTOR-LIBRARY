# TabTimeMachine Architecture

## Overview

TabTimeMachine is a Chrome/Edge Manifest V3 extension that periodically captures browser sessions, including tab metadata and PDF snapshots, saving them to a local folder via a native messaging host.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome/Edge Browser                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              TabTimeMachine Extension                   │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         background.js (Service Worker)           │  │ │
│  │  │                                                   │  │ │
│  │  │  • Timer Management (30min default)              │  │ │
│  │  │  • Capture Logic                                 │  │ │
│  │  │  • Resume/Catch-up (>35min)                      │  │ │
│  │  │  • Tab Enumeration                               │  │ │
│  │  │  • PDF Generation (debugger API)                 │  │ │
│  │  │  • Native Messaging Client                       │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                          │                              │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         options.html / options.js                │  │ │
│  │  │                                                   │  │ │
│  │  │  • Configuration UI                              │  │ │
│  │  │  • Folder Selection                              │  │ │
│  │  │  • Interval Setting                              │  │ │
│  │  │  • PDF Mode Toggle                               │  │ │
│  │  │  • Incognito Toggle                              │  │ │
│  │  │  • Snapshot Now Button                           │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ Native Messaging Protocol         │
│                          │ (stdio, JSON messages)            │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Windows Native Host                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       tabtimemachine_host.exe (Python)                 │ │
│  │                                                          │ │
│  │  • Native Messaging Server                             │ │
│  │  • Folder Selection Dialog (tkinter)                   │ │
│  │  • Atomic File Writing                                 │ │
│  │  • JSON Serialization                                  │ │
│  │  • PDF Decoding (base64)                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ File System I/O                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Output Folder (User Selected)             │ │
│  │                                                          │ │
│  │  • {timestamp}_session.json                            │ │
│  │  • {timestamp}_tab{id}_{title}.pdf (per-tab mode)      │ │
│  │  • {timestamp}_merged.pdf (merged mode)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Initialization Flow
1. **Extension Install/Startup**
   - background.js loads
   - Initialize default settings in chrome.storage.local
   - Check for catch-up (if lastCaptureTime > 35 min ago)
   - Schedule next capture timer

### Automatic Capture Flow
1. **Timer Triggers** (every N minutes)
2. **Query Tabs**: chrome.tabs.query({})
3. **Filter**: Remove incognito if disabled
4. **Collect Metadata**: Extract tab properties
5. **Generate PDFs**: 
   - For each tab: chrome.debugger.attach()
   - Send Page.printToPDF command
   - Receive base64 PDF data
   - chrome.debugger.detach()
6. **Package Data**: Create message with sessionData + pdfData
7. **Send to Native Host**: chrome.runtime.sendNativeMessage()
8. **Native Host Writes**: Atomic file operations
9. **Update State**: Save lastCaptureTime
10. **Reschedule**: Set next timer

### Manual Snapshot Flow
1. **User clicks "Snapshot Now"** in options.html
2. **Message sent**: chrome.runtime.sendMessage({action: 'captureNow'})
3. **Background receives**: Triggers captureSession()
4. **Follow automatic capture flow**: Steps 2-9 above
5. **Response returned**: Success/failure to options.html
6. **UI updated**: Show status message

### Folder Selection Flow
1. **User clicks "Browse..."** in options.html
2. **Message sent**: {action: 'selectFolder'}
3. **Native host receives**: Launches tkinter dialog
4. **User selects folder**: OS folder picker
5. **Folder path returned**: Via native messaging
6. **Saved to storage**: chrome.storage.local
7. **UI updated**: Display folder path

## Security Model

### Extension Permissions
- **tabs**: Query all tabs and their URLs
- **storage**: Save settings locally
- **debugger**: Attach to tabs for PDF generation
- **nativeMessaging**: Communicate with host
- **host_permissions**: Access tab content for PDF

### Native Host Security
- **Registry-based registration**: Only extension with correct ID can connect
- **Local-only**: No network communication
- **User folder selection**: User controls write location
- **Atomic writes**: Prevents partial file corruption

### Privacy
- **Local storage only**: No external servers
- **User controlled**: Can disable incognito capture
- **On-demand deletion**: User manages output folder

## File Formats

### Session JSON
```json
{
  "timestamp": 1704657600000,
  "captureDate": "2024-01-07T12:00:00.000Z",
  "tabCount": 3,
  "tabs": [
    {
      "id": 123456789,
      "url": "https://example.com",
      "title": "Example Page",
      "active": true,
      "pinned": false,
      "index": 0,
      "windowId": 1,
      "favIconUrl": "https://example.com/favicon.ico",
      "incognito": false
    }
  ]
}
```

### PDF Files
- Standard PDF format
- Generated via Chrome DevTools Protocol
- Letter size (8.5" x 11")
- Includes backgrounds
- 0.4" margins

### Native Messaging Protocol
Messages are JSON over stdio with 4-byte length prefix:
```
[4-byte length][JSON payload]
```

## State Management

### Extension Storage (chrome.storage.local)
```javascript
{
  captureInterval: 1800000,        // 30 minutes in ms
  outputFolder: "C:\\Users\\...\\TabCaptures",
  includeIncognito: false,
  pdfMode: "per-tab",              // or "merged"
  lastCaptureTime: 1704657600000   // Unix timestamp
}
```

### Service Worker State
- `captureTimer`: Current setTimeout handle
- Volatile: Reset on service worker restart
- Restored from storage on startup

## Error Handling

### Extension Errors
- **No output folder**: Skip capture, log warning
- **No tabs**: Skip capture, log info
- **PDF generation fails**: Skip tab, continue with others
- **Native host unavailable**: Log error, retry next cycle
- **Debugger attach fails**: Skip tab (likely system page)

### Native Host Errors
- **Folder doesn't exist**: Create folder, retry write
- **Write permission denied**: Return error to extension
- **Invalid message**: Return error response
- **Temp file cleanup**: Always cleanup .tmp files

## Performance Considerations

### PDF Generation
- **Sequential processing**: One tab at a time to avoid resource contention
- **Debugger overhead**: ~1-2 seconds per tab
- **Skip system pages**: chrome://, edge://, extension:// URLs
- **Memory**: Base64 encoding temporarily doubles PDF size in memory

### Timing
- **Service worker lifecycle**: May wake up for timer
- **Catch-up threshold**: 35 minutes allows for brief shutdowns
- **Atomic writes**: Temporary memory overhead for .tmp files

### Storage
- **JSON files**: ~1-10 KB per session
- **PDF files**: ~50-500 KB per tab (varies by content)
- **Merged PDFs**: Single file, sum of individual PDFs
- **No automatic cleanup**: User manages old captures

## Extension Points

### Future Enhancements
1. **Compression**: Compress PDFs or use PDF/A format
2. **Selective capture**: Choose specific tabs/windows
3. **Cloud backup**: Optional upload to cloud storage
4. **History viewer**: Browse past sessions in extension
5. **Search**: Full-text search across captured sessions
6. **Auto-cleanup**: Delete captures older than N days
7. **Notification**: Show toast on successful capture
8. **Statistics**: Track capture count, file sizes, etc.

### Customization Options
- Change PDF paper size/orientation
- Adjust PDF margins
- Include/exclude images in PDFs
- Custom filename templates
- Multiple output folders
- Per-window capture mode

## Testing Strategy

### Unit Testing (Not Implemented)
- Mock chrome.* APIs
- Test timer logic
- Test data transformation

### Integration Testing (Manual)
- End-to-end capture flow
- Native messaging communication
- File system operations
- Error scenarios

### Smoke Testing (Documented)
- See SMOKE_TEST.md for checklist
- Covers all major features
- Tests error conditions
- Validates output files
