/// <reference types="vite/client" />
/// <reference types="electron-vite/node" />

interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    api: {
        openDirectory: () => Promise<string | null>
        readDir: (path: string) => Promise<Array<{ name: string, isDirectory: boolean, path: string }>>
        readFile: (path: string) => Promise<string>
        createTerminal: () => void
        writeTerminal: (data: string) => void
        resizeTerminal: (cols: number, rows: number) => void

        // AI API
        chat: (messages: Array<{ role: string, content: string }>) => Promise<{ success: boolean, error?: string }>
        onChunk: (callback: (chunk: string) => void) => () => void

        // Config API
        getConfig: (key: string) => Promise<any>
        setConfig: (key: string, value: any) => Promise<{ success: boolean }>
        getAllConfig: () => Promise<any>

        // Ollama API
        listOllamaModels: (baseUrl: string) => Promise<{ success: boolean, models?: any[], error?: string }>
    }
}
