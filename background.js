// Background service worker for TabTimeMachine

const STORAGE_KEYS = {
  LAST_CAPTURE: 'lastCaptureTime',
  INTERVAL: 'captureInterval',
  OUTPUT_FOLDER: 'outputFolder',
  INCOGNITO: 'includeIncognito',
  PDF_MODE: 'pdfMode', // 'per-tab' or 'merged'
};

const DEFAULT_INTERVAL = 30 * 60 * 1000; // 30 minutes
const CATCHUP_THRESHOLD = 35 * 60 * 1000; // 35 minutes

let captureTimer = null;

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('TabTimeMachine installed');
  await initializeSettings();
  scheduleNextCapture();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('TabTimeMachine started');
  await checkCatchup();
  scheduleNextCapture();
});

async function initializeSettings() {
  const settings = await chrome.storage.local.get([
    STORAGE_KEYS.INTERVAL,
    STORAGE_KEYS.INCOGNITO,
    STORAGE_KEYS.PDF_MODE,
    STORAGE_KEYS.OUTPUT_FOLDER,
  ]);

  if (!settings[STORAGE_KEYS.INTERVAL]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.INTERVAL]: DEFAULT_INTERVAL });
  }
  if (settings[STORAGE_KEYS.INCOGNITO] === undefined) {
    await chrome.storage.local.set({ [STORAGE_KEYS.INCOGNITO]: false });
  }
  if (!settings[STORAGE_KEYS.PDF_MODE]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.PDF_MODE]: 'per-tab' });
  }
  if (!settings[STORAGE_KEYS.OUTPUT_FOLDER]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.OUTPUT_FOLDER]: '' });
  }
}

async function checkCatchup() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.LAST_CAPTURE]);
  const lastCapture = result[STORAGE_KEYS.LAST_CAPTURE];
  
  if (lastCapture) {
    const timeSinceLastCapture = Date.now() - lastCapture;
    if (timeSinceLastCapture > CATCHUP_THRESHOLD) {
      console.log('Catch-up needed, capturing session now');
      await captureSession();
    }
  }
}

function scheduleNextCapture() {
  if (captureTimer) {
    clearTimeout(captureTimer);
  }

  chrome.storage.local.get([STORAGE_KEYS.INTERVAL], (result) => {
    const interval = result[STORAGE_KEYS.INTERVAL] || DEFAULT_INTERVAL;
    captureTimer = setTimeout(async () => {
      await captureSession();
      scheduleNextCapture();
    }, interval);
    console.log(`Next capture scheduled in ${interval / 1000} seconds`);
  });
}

async function captureSession() {
  console.log('Capturing session...');
  
  try {
    const settings = await chrome.storage.local.get([
      STORAGE_KEYS.INCOGNITO,
      STORAGE_KEYS.PDF_MODE,
      STORAGE_KEYS.OUTPUT_FOLDER,
    ]);

    const includeIncognito = settings[STORAGE_KEYS.INCOGNITO] || false;
    const pdfMode = settings[STORAGE_KEYS.PDF_MODE] || 'per-tab';
    const outputFolder = settings[STORAGE_KEYS.OUTPUT_FOLDER] || '';

    if (!outputFolder) {
      console.warn('Output folder not set, skipping capture');
      return;
    }

    // Get all tabs
    const tabs = await chrome.tabs.query({});
    const filteredTabs = includeIncognito ? tabs : tabs.filter(tab => !tab.incognito);

    if (filteredTabs.length === 0) {
      console.log('No tabs to capture');
      return;
    }

    // Create session data
    const timestamp = Date.now();
    const sessionData = {
      timestamp,
      captureDate: new Date(timestamp).toISOString(),
      tabCount: filteredTabs.length,
      tabs: filteredTabs.map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        pinned: tab.pinned,
        index: tab.index,
        windowId: tab.windowId,
        favIconUrl: tab.favIconUrl,
        incognito: tab.incognito,
      })),
    };

    // Generate PDFs
    let pdfData = null;
    if (pdfMode === 'merged') {
      pdfData = await generateMergedPDF(filteredTabs);
    } else {
      pdfData = await generatePerTabPDFs(filteredTabs);
    }

    // Send to native host
    await sendToNativeHost({
      sessionData,
      pdfData,
      outputFolder,
      timestamp,
      pdfMode,
    });

    // Update last capture time
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_CAPTURE]: timestamp });
    console.log('Session captured successfully');

  } catch (error) {
    console.error('Error capturing session:', error);
  }
}

async function generatePerTabPDFs(tabs) {
  const pdfs = [];

  for (const tab of tabs) {
    try {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
          tab.url.startsWith('chrome-extension://') || tab.url.startsWith('extension://')) {
        console.log(`Skipping system page: ${tab.url}`);
        continue;
      }

      const pdfBase64 = await capturePDF(tab.id);
      if (pdfBase64) {
        pdfs.push({
          tabId: tab.id,
          title: tab.title,
          url: tab.url,
          pdfData: pdfBase64,
        });
      }
    } catch (error) {
      console.error(`Error generating PDF for tab ${tab.id}:`, error);
    }
  }

  return pdfs;
}

async function generateMergedPDF(tabs) {
  // For merged mode, we'll collect all PDFs and mark them for merging by the native host
  const pdfs = await generatePerTabPDFs(tabs);
  return { merged: true, pdfs };
}

async function capturePDF(tabId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Attach debugger
      await chrome.debugger.attach({ tabId }, '1.3');

      // Wait a bit for the page to settle
      await new Promise(r => setTimeout(r, 500));

      // Send Page.printToPDF command
      const result = await chrome.debugger.sendCommand(
        { tabId },
        'Page.printToPDF',
        {
          printBackground: true,
          landscape: false,
          paperWidth: 8.5,
          paperHeight: 11,
          marginTop: 0.4,
          marginBottom: 0.4,
          marginLeft: 0.4,
          marginRight: 0.4,
        }
      );

      // Detach debugger
      await chrome.debugger.detach({ tabId });

      resolve(result.data);
    } catch (error) {
      console.error(`Failed to capture PDF for tab ${tabId}:`, error);
      try {
        await chrome.debugger.detach({ tabId });
      } catch (e) {
        // Ignore detach errors
      }
      resolve(null);
    }
  });
}

async function sendToNativeHost(payload) {
  try {
    const response = await chrome.runtime.sendNativeMessage(
      'com.tabtimemachine.host',
      payload
    );
    console.log('Native host response:', response);
    return response;
  } catch (error) {
    console.error('Error communicating with native host:', error);
    throw error;
  }
}

// Listen for manual snapshot requests from options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureNow') {
    captureSession().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'selectFolder') {
    // Request folder selection from native host
    chrome.runtime.sendNativeMessage(
      'com.tabtimemachine.host',
      { action: 'selectFolder' },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, folder: response.folder });
        }
      }
    );
    return true;
  } else if (request.action === 'updateSettings') {
    scheduleNextCapture();
    sendResponse({ success: true });
    return false;
  }
});

console.log('TabTimeMachine background script loaded');
