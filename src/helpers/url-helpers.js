// This is taken from: https://benjamin-altpeter.de/shell-openexternal-dangers/

import { URL } from 'url';
import { ensureDirSync } from 'fs-extra';
import { shell } from 'electron';

import { ALLOWED_PROTOCOLS } from '../config';

const debug = require('debug')('Ferdi:Helpers:url');

export function isValidExternalURL(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (_) {
    return false;
  }

  const isAllowed = ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);

  debug('protocol check is', isAllowed, 'for:', url);

  return isAllowed;
}

export async function openPath(folderName) {
  ensureDirSync(folderName);
  shell.openPath(folderName);
}

// TODO: Need to verify and fix/remove the skipping logic. Ideally, we should never skip this check
export function openExternalUrl(url, skipValidityCheck = false) {
  if (skipValidityCheck || isValidExternalURL(url)) {
    shell.openExternal(url);
  }
}
