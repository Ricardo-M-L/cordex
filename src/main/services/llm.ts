import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { Ollama } from 'ollama'
import { store } from '../config/store'

export interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
    images?: string[]
}

export class LLMService {
    private openai?: OpenAI
    private anthropic?: Anthropic
    private ollama?: Ollama

    async chat(messages: Message[], onChunk: (text: string) => void): Promise<string> {
        const provider = store.get('selectedProvider')
        const model = store.get('selectedModel')

        if (provider === 'openai') {
            return this.chatOpenAI(messages, model, onChunk)
        } else if (provider === 'anthropic') {
            return this.chatAnthropic(messages, model, onChunk)
        } else if (provider === 'deepseek') {
            return this.chatDeepSeek(messages, model, onChunk)
        } else if (provider === 'qwen') {
            return this.chatQwen(messages, model, onChunk)
        } else {
            return this.chatOllama(messages, model, onChunk)
        }
    }

    private async chatOpenAI(
        messages: Message[],
        model: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        const apiKey = store.get('openaiApiKey')
        if (!apiKey) {
            throw new Error('OpenAI API key not configured. Please set it in Settings.')
        }

        if (!this.openai || this.openai.apiKey !== apiKey) {
            this.openai = new OpenAI({ apiKey })
        }

        return this.executeOpenAICompatibleChat(this.openai, model, messages, onChunk)
    }

    private async chatDeepSeek(
        messages: Message[],
        model: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        const apiKey = store.get('deepseekApiKey')
        if (!apiKey) {
            throw new Error('DeepSeek API key not configured. Please set it in Settings.')
        }

        // DeepSeek uses OpenAI compatible API
        const deepseek = new OpenAI({
            apiKey,
            baseURL: 'https://api.deepseek.com'
        })

        return this.executeOpenAICompatibleChat(deepseek, model, messages, onChunk)
    }

    private async chatQwen(
        messages: Message[],
        model: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        const apiKey = store.get('qwenApiKey')
        if (!apiKey) {
            throw new Error('Qwen API key not configured. Please set it in Settings.')
        }

        // Qwen (DashScope) uses OpenAI compatible API
        const qwen = new OpenAI({
            apiKey,
            baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        })

        return this.executeOpenAICompatibleChat(qwen, model, messages, onChunk)
    }

    private async executeOpenAICompatibleChat(
        client: OpenAI,
        model: string,
        messages: Message[],
        onChunk: (text: string) => void
    ): Promise<string> {
        const formattedMessages = messages.map(m => {
            if (m.images && m.images.length > 0) {
                return {
                    role: m.role,
                    content: [
                        { type: 'text', text: m.content },
                        ...m.images.map(img => ({
                            type: 'image_url',
                            image_url: { url: img }
                        }))
                    ]
                }
            }
            return { role: m.role, content: m.content }
        })

        const stream = await client.chat.completions.create({
            model,
            messages: formattedMessages as any,
            stream: true,
            max_tokens: 4096
        })

        let fullResponse = ''
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
                fullResponse += content
                onChunk(content)
            }
        }

        return fullResponse
    }

    private async chatAnthropic(
        messages: Message[],
        model: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        const apiKey = store.get('anthropicApiKey')
        if (!apiKey) {
            throw new Error('Anthropic API key not configured. Please set it in Settings.')
        }

        if (!this.anthropic || this.anthropic.apiKey !== apiKey) {
            this.anthropic = new Anthropic({ apiKey })
        }

        // 分离系统消息
        const systemMessage = messages.find(m => m.role === 'system')
        const userMessages = messages.filter(m => m.role !== 'system')

        const formattedMessages = userMessages.map(m => {
            if (m.images && m.images.length > 0) {
                return {
                    role: m.role as 'user' | 'assistant',
                    content: [
                        { type: 'text' as const, text: m.content },
                        ...m.images.map(img => {
                            const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/)
                            if (match) {
                                return {
                                    type: 'image' as const,
                                    source: {
                                        type: 'base64' as const,
                                        media_type: match[1] as any,
                                        data: match[2]
                                    }
                                }
                            }
                            return { type: 'text' as const, text: '' }
                        }).filter(p => p.type !== 'text' || p.text !== '')
                    ]
                }
            }
            return {
                role: m.role as 'user' | 'assistant',
                content: m.content
            }
        })

        const stream = await this.anthropic.messages.create({
            model,
            max_tokens: 4096,
            system: systemMessage?.content,
            messages: formattedMessages,
            stream: true
        })

        let fullResponse = ''
        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const content = chunk.delta.text
                fullResponse += content
                onChunk(content)
            }
        }

        return fullResponse
    }

    private async chatOllama(
        messages: Message[],
        model: string,
        onChunk: (text: string) => void
    ): Promise<string> {
        const baseUrl = store.get('ollamaBaseUrl')
        if (!baseUrl) {
            throw new Error('Ollama server URL not configured. Please set it in Settings.')
        }

        if (!this.ollama) {
            this.ollama = new Ollama({ host: baseUrl })
        }

        const response = await this.ollama.chat({
            model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                images: m.images ? m.images.map(img => img.replace(/^data:image\/[a-z]+;base64,/, '')) : undefined
            })),
            stream: true
        })

        let fullResponse = ''
        for await (const chunk of response) {
            if (chunk.message?.content) {
                const content = chunk.message.content
                fullResponse += content
                onChunk(content)
            }
        }

        return fullResponse
    }
}
