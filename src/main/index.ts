import { app, shell, BrowserWindow, ipcMain, dialog, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { readdir, readFile, stat } from 'fs/promises'
import { LLMService } from './services/llm'
import { store } from './config/store'

const llmService = new LLMService()

function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC Handlers
    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (canceled) {
            return null
        } else {
            return filePaths[0]
        }
    })

    ipcMain.handle('fs:readDir', async (_, path) => {
        try {
            const dirents = await readdir(path, { withFileTypes: true })
            return dirents.map(dirent => ({
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                path: join(path, dirent.name)
            }))
        } catch (error) {
            console.error('Failed to read directory', error)
            return []
        }
    })

    ipcMain.handle('fs:readFile', async (_, path) => {
        try {
            return await readFile(path, 'utf-8')
        } catch (error) {
            console.error('Failed to read file', error)
            return ''
        }
    })

    // AI and Config IPC Handlers

    // AI Chat
    ipcMain.handle('ai:chat', async (event, messages) => {
        try {
            let fullResponse = ''
            await llmService.chat(messages, (chunk: string) => {
                event.sender.send('ai:chunk', chunk)
            })
            return { success: true }
        } catch (error: any) {
            console.error('AI chat error:', error)
            return { success: false, error: error.message }
        }
    })

    // Configuration
    ipcMain.handle('config:get', (_, key) => {
        return store.get(key)
    })

    ipcMain.handle('config:set', (_, key, value) => {
        store.set(key, value)
        return { success: true }
    })

    ipcMain.handle('config:getAll', () => {
        return store.store
    })

    // Permission handling for microphone (Voice Input)
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true)
        } else {
            callback(false)
        }
    })

    // Ollama API
    ipcMain.handle('ollama:listModels', async (_, baseUrl: string) => {
        try {
            const { Ollama } = require('ollama')
            const ollama = new Ollama({ host: baseUrl })
            const response = await ollama.list()
            return { success: true, models: response.models }
        } catch (error: any) {
            console.error('Failed to list Ollama models:', error)
            return { success: false, error: error.message }
        }
    })

    // Plugin Management
    ipcMain.handle('plugin:list', () => {
        return { success: true, plugins: store.getPlugins() }
    })

    ipcMain.handle('plugin:add', (_, plugin) => {
        try {
            store.addPlugin(plugin)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle('plugin:remove', (_, pluginId: string) => {
        try {
            store.removePlugin(pluginId)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    ipcMain.handle('plugin:toggle', (_, pluginId: string) => {
        try {
            store.togglePlugin(pluginId)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    // Terminal IPC - Temporarily disabled due to node-pty compatibility issues
    /*
    let ptyProcess: any = null
  
    ipcMain.on('terminal:create', (event) => {
      if (ptyProcess) return
  
      const shell = process.env[process.platform === 'win32' ? 'COMSPEC' : 'SHELL'] || '/bin/bash'
      const sender = event.sender
      
      try {
        const pty = require('node-pty')
        
        ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-color',
          cols: 80,
          rows: 30,
          cwd: process.env.HOME,
          env: process.env
        })
  
        ptyProcess.on('data', (data: string) => {
          sender.send('terminal:data', data)
        })
      } catch (e) {
        console.error('Failed to spawn pty', e)
        sender.send('terminal:data', '\r\nFailed to initialize terminal: node-pty not found or failed to load.\r\n')
      }
    })
  
    ipcMain.on('terminal:write', (_, data) => {
      if (ptyProcess) {
        ptyProcess.write(data)
      }
    })
  
    ipcMain.on('terminal:resize', (_, { cols, rows }) => {
      if (ptyProcess) {
        ptyProcess.resize(cols, rows)
      }
    })
    */

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
