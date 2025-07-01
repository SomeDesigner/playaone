// preload.js
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose APIs here if needed later
});
