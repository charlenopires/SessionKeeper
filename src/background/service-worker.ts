import { initializeDatabase } from '../storage';
import { getErrorMessage } from '../storage/errors';

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await initializeDatabase();

    const { reason, previousVersion } = details;

    switch (reason) {
      case 'install':
        console.log('[SessionKeeper] Extension installed successfully');
        break;
      case 'update':
        console.log(`[SessionKeeper] Updated from v${previousVersion} to v${chrome.runtime.getManifest().version}`);
        break;
      case 'chrome_update':
      case 'shared_module_update':
        // Silent on browser updates
        break;
    }
  } catch (error) {
    const { technical, user } = getErrorMessage(error);
    console.error('[SessionKeeper] Initialization failed:', technical, error);

    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SessionKeeper Error',
      message: user,
      priority: 2,
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await initializeDatabase();
    console.log('[SessionKeeper] Browser started, database ready');
  } catch (error) {
    const { technical, user } = getErrorMessage(error);
    console.error('[SessionKeeper] Startup failed:', technical, error);

    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SessionKeeper Error',
      message: user,
      priority: 2,
    });
  }
});
