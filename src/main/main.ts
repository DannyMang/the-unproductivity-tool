/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  class AppUpdater {
    constructor() {
      log.transports.file.level = 'info';
      autoUpdater.logger = log;
      autoUpdater.checkForUpdatesAndNotify();
    }
  }

  let mainWindow: BrowserWindow | null = null;

  ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
  });

  // Handle monitoring requests from renderer
  ipcMain.on('START_MONITORING', async (event) => {
    console.log('Starting application monitoring');
    startAppMonitoring(event);
  });

  // Application detection system
  const TARGET_APPLICATIONS = [
    'Code',        // VS Code
    'Terminal',    // Terminal
    'iTerm',       // iTerm2
    'Sublime Text', // Sublime Text
    'Atom',        // Atom editor
    'WebStorm',    // JetBrains IDEs
    'IntelliJ',    // IntelliJ IDEA
    'PyCharm',     // PyCharm
    'Xcode',       // Xcode
    'Visual Studio', // Visual Studio
    'Figma',       // Figma
    'Slack',       // Slack
    'Notion',      // Notion
    'Spotify',     // Spotify
  ];

  let monitoringInterval: NodeJS.Timeout | null = null;

  function stopAppMonitoring() {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
      console.log('App monitoring stopped');
    }
  }

  function startAppMonitoring(event: any) {
    const { exec } = require('child_process');

    monitoringInterval = setInterval(() => {
      if (process.platform === 'darwin') {
        // macOS: use AppleScript to get frontmost application
        exec(`osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'`, (error: any, stdout: string) => {
          const appName = stdout.trim();
          console.log('Current app:', appName);

          if (TARGET_APPLICATIONS.some(target => appName.toLowerCase().includes(target.toLowerCase()))) {
            console.log('DETECTED TARGET APPLICATION:', appName);
            // Trigger distraction
            console.log('SENDING TRIGGER_DISTRACTION event to renderer...');
            event.sender.send('TRIGGER_DISTRACTION', {
              type: 'app_detected',
              app: appName,
              message: 'STOP WORKING! HAVE SOME FUN INSTEAD! 🎉'
            });
            console.log('TRIGGER_DISTRACTION event sent successfully');
          }
        });
      } else if (process.platform === 'win32') {
        // Windows: use PowerShell to get active window
        exec('powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \\""} | Select-Object ProcessName, MainWindowTitle | Sort-Object CPU -Descending | Select-Object -First 1"', (error: any, stdout: string) => {
          const output = stdout.trim();
          console.log('Current app:', output);

          if (TARGET_APPLICATIONS.some(target => output.toLowerCase().includes(target.toLowerCase()))) {
            console.log('DETECTED TARGET APPLICATION:', output);
            console.log('SENDING TRIGGER_DISTRACTION event to renderer...');
            event.sender.send('TRIGGER_DISTRACTION', {
              type: 'app_detected',
              app: output,
              message: 'TIME FOR A BREAK! 🎮'
            });
            console.log('TRIGGER_DISTRACTION event sent successfully');
          }
        });
      }
    }, 2000); // Check every 2 seconds
  }

  if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
  }

  const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

  if (isDebug) {
    require('electron-debug').default();
  }

  const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
      .default(
        extensions.map((name) => installer[name]),
        forceDownload,
      )
      .catch(console.log);
  };

  const createWindow = async () => {
    console.log('Creating window...');
    if (isDebug) {
      console.log('Installing extensions...');
      await installExtensions();
    }

    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    console.log('Resources path:', RESOURCES_PATH);

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };

    // Get screen dimensions
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    console.log('Screen dimensions:', { screenWidth, screenHeight });

    mainWindow = new BrowserWindow({
      show: false,
      width: screenWidth,
      height: screenHeight,
      x: 0,
      y: 0,
      icon: getAssetPath('icon.png'),
      transparent: true,
      frame: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      hasShadow: false,
      resizable: false,
      focusable: true,
      type: 'normal',
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    console.log('Loading URL...');
    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
      console.log('Window ready to show');
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }
      // Show normally - no stealth behavior
      console.log('Showing window...');
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      // Allow normal window closing
      console.log('Window closed normally');
      stopAppMonitoring();
      mainWindow = null;
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load URL:', { errorCode, errorDescription, validatedURL });
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully');
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
      shell.openExternal(edata.url);
      return { action: 'deny' };
    });

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    try {
      new AppUpdater();
    } catch (error) {
      console.log('AutoUpdater failed (this is normal in development):', error);
    }

    // Temporarily disable menu to isolate crash
    // const menuBuilder = new MenuBuilder(mainWindow);
    // menuBuilder.buildMenu();
    console.log('Menu temporarily disabled for debugging');
  };

  /**
   * Add event listeners...
   */

  app.on('window-all-closed', () => {
    // Allow normal app termination
    stopAppMonitoring();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    // Ensure clean shutdown
    stopAppMonitoring();
  });

  app.on('will-quit', (event) => {
    // Clean up before quitting
    stopAppMonitoring();
  });

  app
    .whenReady()
    .then(() => {
      console.log('App is ready, creating window...');
      createWindow();
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow();
      });
    })
    .catch((error) => {
      console.error('Error during app startup:', error);
    });
}