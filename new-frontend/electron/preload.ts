import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  avatar: {
    open: () => ipcRenderer.send('avatar-window-open'),
    close: () => ipcRenderer.send('avatar-window-close'),
    setAlwaysOnTop: (b: boolean) => ipcRenderer.send('avatar-window-always-on-top', b),
    setSize: (w: number, h: number) => ipcRenderer.send('avatar-window-set-size', w, h),
    setOpacity: (n: number) => ipcRenderer.send('avatar-window-set-opacity', n),
  },
  app: {
    getVersion: () => '1.0.0',
    onPipelineEvent: (cb: (event: unknown) => void) => {
      const listener = (_: unknown, data: unknown) => cb(data);
      ipcRenderer.on('pipeline-event-channel', listener);
      return () => {
        ipcRenderer.removeListener('pipeline-event-channel', listener);
      };
    },
  },
});
