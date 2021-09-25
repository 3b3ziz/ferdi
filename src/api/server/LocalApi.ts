import { ipcRenderer } from 'electron';
import { session } from '@electron/remote';
import du from 'du';

import { getServicePartitionsDirectory } from '../../helpers/service-helpers';

const debug = require('debug')('Ferdi:LocalApi');

export default class LocalApi {
  // Settings
  getAppSettings(type: any) {
    return new Promise(resolve => {
      ipcRenderer.once('appSettings', (_event, resp) => {
        debug('LocalApi::getAppSettings resolves', resp.type, resp.data);
        resolve(resp);
      });

      ipcRenderer.send('getAppSettings', type);
    });
  }

  async updateAppSettings(type: any, data: any) {
    debug('LocalApi::updateAppSettings resolves', type, data);
    ipcRenderer.send('updateAppSettings', {
      type,
      data,
    });
  }

  // Services
  async getAppCacheSize() {
    const partitionsDir = getServicePartitionsDirectory();
    return new Promise((resolve, reject) => {
      du(partitionsDir, {}, (err: Error | null, size?: number | undefined) => {
        if (err) reject(err);

        debug('LocalApi::getAppCacheSize resolves', size);
        resolve(size);
      });
    });
  }

  async clearCache(serviceId: string | null = null) {
    const s = serviceId
      ? session.fromPartition(`persist:service-${serviceId}`)
      : session.defaultSession;

    debug('LocalApi::clearCache resolves', serviceId || 'clearAppCache');
    await s.clearStorageData({
      storages: [
        'appcache',
        'filesystem',
        'indexdb',
        'shadercache',
        'websql',
        'serviceworkers',
        'cachestorage',
      ],
      quotas: ['temporary', 'persistent', 'syncable'],
    });
    return s.clearCache();
  }
}
