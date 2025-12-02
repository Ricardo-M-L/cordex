import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export interface StoreSchema {
    openaiApiKey?: string
    anthropicApiKey?: string
    deepseekApiKey?: string
    qwenApiKey?: string
    ollamaBaseUrl?: string
    ollamaModel?: string
    selectedProvider: 'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'qwen'
    selectedModel: string
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
            ollamaBaseUrl: 'http://binary.xin:11434'
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
}

export const store = new ConfigStore()
