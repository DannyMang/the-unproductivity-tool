// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent, shell } from 'electron';

export type Channels = 'ipc-example' | 'START_MONITORING' | 'TRIGGER_DISTRACTION';

const electronAPI = {
  send: (channel: Channels, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: Channels, func: (...args: unknown[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  once: (channel: Channels, func: (...args: unknown[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => func(...args));
  },
  openExternal: (url: string) => {
    shell.openExternal(url);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
