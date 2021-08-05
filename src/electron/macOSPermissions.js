import { app, systemPreferences, dialog } from 'electron';
import fs from 'fs';
import macosVersion from 'macos-version';
import path from 'path';
import { askForScreenCaptureAccess } from 'node-mac-permissions';

const debug = require('debug')('Ferdi:macOSPermissions');

const permissionExists = macosVersion.isGreaterThanOrEqualTo('10.15');
const filePath = path.join(
  app.getPath('userData'),
  '.has-app-requested-screen-capture-permissions',
);

function hasPromptedForPermission() {
  if (!permissionExists) {
    return false;
  }

  if (filePath && fs.existsSync(filePath)) {
    return true;
  }

  return false;
}

function hasScreenCapturePermission() {
  if (!permissionExists) {
    return true;
  }

  const screenCaptureStatus = systemPreferences.getMediaAccessStatus('screen');
  return screenCaptureStatus === 'granted';
}

function createStatusFile() {
  try {
    fs.writeFileSync(filePath, '');
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, '');
    }

    throw error;
  }
}

export const askFormacOSPermissions = async mainWindow => {
  debug('Checking camera & microphone permissions');
  systemPreferences.askForMediaAccess('camera');
  systemPreferences.askForMediaAccess('microphone');

  if (!hasPromptedForPermission() && !hasScreenCapturePermission()) {
    debug('Checking screen capture permissions');

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'Enable Screen Sharing',
      detail:
        'To enable screen sharing for some services, Ferdi needs the permission to record your screen.',
      buttons: ['Allow screen sharing', 'No', 'Ask me later'],
      defaultId: 0,
      cancelId: 2,
    });

    if (response === 0) {
      debug('Asking for access');
      askForScreenCaptureAccess();
      createStatusFile();
    } else if (response === 1) {
      debug("Don't ask again");
      createStatusFile();
    }
  }
};
