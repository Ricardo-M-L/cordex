import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),

    // AI API
    chat: (messages: any[]) => ipcRenderer.invoke('ai:chat', messages),
    onChunk: (callback: (chunk: string) => void) => {
        const handler = (_: any, chunk: string) => callback(chunk)
        ipcRenderer.on('ai:chunk', handler)
        return () => ipcRenderer.removeListener('ai:chunk', handler)
    },

    // Config API
    getConfig: (key: string) => ipcRenderer.invoke('config:get', key),
    setConfig: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),
    getAllConfig: () => ipcRenderer.invoke('config:getAll'),

    // Ollama API
    listOllamaModels: (baseUrl: string) => ipcRenderer.invoke('ollama:listModels', baseUrl),

    // Terminal API - Temporarily disabled
    // createTerminal: () => ipcRenderer.send('terminal:create'),
    // writeTerminal: (data: string) => ipcRenderer.send('terminal:write', data),
    // resizeTerminal: (cols: number, rows: number) => ipcRenderer.send('terminal:resize', { cols, rows })
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
