// Options page script for TabTimeMachine

const STORAGE_KEYS = {
  INTERVAL: 'captureInterval',
  OUTPUT_FOLDER: 'outputFolder',
  INCOGNITO: 'includeIncognito',
  PDF_MODE: 'pdfMode',
};

// Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  attachEventListeners();
});

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    STORAGE_KEYS.INTERVAL,
    STORAGE_KEYS.OUTPUT_FOLDER,
    STORAGE_KEYS.INCOGNITO,
    STORAGE_KEYS.PDF_MODE,
  ]);

  // Set interval (convert from ms to minutes)
  const intervalMinutes = (settings[STORAGE_KEYS.INTERVAL] || 30 * 60 * 1000) / 60000;
  document.getElementById('interval').value = intervalMinutes;

  // Set output folder
  const outputFolder = settings[STORAGE_KEYS.OUTPUT_FOLDER] || '';
  document.getElementById('folder-path').textContent = outputFolder || 'No folder selected';

  // Set incognito toggle
  document.getElementById('include-incognito').checked = settings[STORAGE_KEYS.INCOGNITO] || false;

  // Set PDF mode
  document.getElementById('pdf-mode').value = settings[STORAGE_KEYS.PDF_MODE] || 'per-tab';
}

function attachEventListeners() {
  document.getElementById('select-folder').addEventListener('click', selectFolder);
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('snapshot-now').addEventListener('click', captureNow);
}

async function selectFolder() {
  try {
    showStatus('Requesting folder selection...', 'success');
    
    const response = await chrome.runtime.sendMessage({ action: 'selectFolder' });
    
    if (response.success && response.folder) {
      await chrome.storage.local.set({ [STORAGE_KEYS.OUTPUT_FOLDER]: response.folder });
      document.getElementById('folder-path').textContent = response.folder;
      showStatus('Folder selected successfully!', 'success');
    } else {
      showStatus('Failed to select folder: ' + (response.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error selecting folder:', error);
    showStatus('Error selecting folder: ' + error.message, 'error');
  }
}

async function saveSettings() {
  try {
    const intervalMinutes = parseInt(document.getElementById('interval').value);
    const includeIncognito = document.getElementById('include-incognito').checked;
    const pdfMode = document.getElementById('pdf-mode').value;

    if (isNaN(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 1440) {
      showStatus('Please enter a valid interval between 1 and 1440 minutes', 'error');
      return;
    }

    const settings = {
      [STORAGE_KEYS.INTERVAL]: intervalMinutes * 60 * 1000,
      [STORAGE_KEYS.INCOGNITO]: includeIncognito,
      [STORAGE_KEYS.PDF_MODE]: pdfMode,
    };

    await chrome.storage.local.set(settings);
    
    // Notify background script to reschedule
    await chrome.runtime.sendMessage({ action: 'updateSettings' });
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

async function captureNow() {
  try {
    const button = document.getElementById('snapshot-now');
    button.disabled = true;
    button.textContent = 'Capturing...';
    
    showStatus('Capturing session...', 'success');
    
    const response = await chrome.runtime.sendMessage({ action: 'captureNow' });
    
    if (response.success) {
      showStatus('Session captured successfully!', 'success');
    } else {
      showStatus('Failed to capture session: ' + (response.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error capturing session:', error);
    showStatus('Error capturing session: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('snapshot-now');
    button.disabled = false;
    button.textContent = '📸 Snapshot Now';
  }
}

function showStatus(message, type) {
  const statusElement = document.getElementById('status-message');
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
  statusElement.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 5000);
}
