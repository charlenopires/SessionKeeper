import { initializeDatabase } from '../storage';
import { getErrorMessage } from '../storage/errors';

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await initializeDatabase();

    const installReason = details.reason;
    const previousVersion = details.previousVersion;

    if (installReason === 'install') {
      console.log('SessionKeeper extension installed and database initialized');
    } else if (installReason === 'update') {
      console.log(`SessionKeeper updated from version ${previousVersion}. Database migrations applied automatically.`);
    }
  } catch (error) {
    const { technical, user } = getErrorMessage(error);
    console.error('Failed to initialize SessionKeeper:', technical, error);

    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SessionKeeper Initialization Error',
      message: user,
      priority: 2,
    });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await initializeDatabase();
    console.log('SessionKeeper extension started and database initialized');
  } catch (error) {
    const { technical, user } = getErrorMessage(error);
    console.error('Failed to initialize SessionKeeper on startup:', technical, error);

    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'SessionKeeper Startup Error',
      message: user,
      priority: 2,
    });
  }
});
