import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export interface Plugin {
    id: string
    name: string
    version: string
    enabled: boolean
    author?: string
    description?: string
}

export interface StoreSchema {
    openaiApiKey?: string
    anthropicApiKey?: string
    deepseekApiKey?: string
    qwenApiKey?: string
    geminiApiKey?: string
    ollamaBaseUrl?: string
    ollamaModel?: string
    selectedProvider: 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'qwen' | 'gemini'
    selectedModel: string
    theme?: 'dark' | 'light'
    fontSize?: number
    autoSave?: boolean
    defaultLayout?: 'agent' | 'editor'
    enableSuggestions?: boolean
    plugins?: Plugin[]
}

class ConfigStore {
    private filePath: string
    private data: StoreSchema

    constructor() {
        const userDataPath = app.getPath('userData')
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true })
        }
        this.filePath = join(userDataPath, 'cordex-config.json')
        this.data = this.load()
    }

    private load(): StoreSchema {
        try {
            if (existsSync(this.filePath)) {
                const content = readFileSync(this.filePath, 'utf-8')
                return { ...this.getDefaults(), ...JSON.parse(content) }
            }
        } catch (error) {
            console.error('Failed to load config:', error)
        }
        return this.getDefaults()
    }

    private save(): void {
        try {
            writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
        } catch (error) {
            console.error('Failed to save config:', error)
        }
    }

    private getDefaults(): StoreSchema {
        return {
            selectedProvider: 'ollama',
            selectedModel: 'gemma2:2b',
            ollamaBaseUrl: 'http://binary.xin:11434',
            theme: 'dark',
            fontSize: 14,
            autoSave: true,
            defaultLayout: 'agent',
            enableSuggestions: true,
            plugins: []
        }
    }

    get<K extends keyof StoreSchema>(key: K): StoreSchema[K] {
        return this.data[key]
    }

    set<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
        this.data[key] = value
        this.save()
    }

    get store(): StoreSchema {
        return { ...this.data }
    }

    // Plugin management methods
    addPlugin(plugin: Plugin): void {
        const plugins = this.data.plugins || []
        const existingIndex = plugins.findIndex(p => p.id === plugin.id)

        if (existingIndex >= 0) {
            plugins[existingIndex] = plugin
        } else {
            plugins.push(plugin)
        }

        this.data.plugins = plugins
        this.save()
    }

    removePlugin(pluginId: string): void {
        const plugins = this.data.plugins || []
        this.data.plugins = plugins.filter(p => p.id !== pluginId)
        this.save()
    }

    togglePlugin(pluginId: string): void {
        const plugins = this.data.plugins || []
        const plugin = plugins.find(p => p.id === pluginId)

        if (plugin) {
            plugin.enabled = !plugin.enabled
            this.data.plugins = plugins
            this.save()
        }
    }

    getPlugins(): Plugin[] {
        return this.data.plugins || []
    }
}

export const store = new ConfigStore()
