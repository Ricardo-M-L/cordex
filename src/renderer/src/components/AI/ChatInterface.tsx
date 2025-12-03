import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Sparkles, Settings, Mic, MicOff, Image as ImageIcon, AtSign, ChevronDown, Loader2, Square } from 'lucide-react'
import SettingsPanel from '../Settings/SettingsPanel'
import ReactMarkdown from 'react-markdown'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    images?: string[]
    timestamp: number
}

// 定义模型列表（与 SettingsPanel 保持一致，理想情况应该提取到共享常量）
const MODELS = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
        { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
        { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    qwen: [
        { id: 'qwen-max', name: 'Qwen Max' },
        { id: 'qwen-plus', name: 'Qwen Plus' },
        { id: 'qwen-turbo', name: 'Qwen Turbo' }
    ],
    gemini: [
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ],
    ollama: [] as Array<{ id: string, name: string }> // 动态加载
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是 Cordex AI 助手。我可以帮你写代码、解释概念或回答问题。\n\n你可以直接输入问题，或者点击麦克风使用语音输入。',
            timestamp: Date.now()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    // 新增状态
    const [isListening, setIsListening] = useState(false)
    const [currentProvider, setCurrentProvider] = useState<'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'qwen' | 'gemini'>('ollama')
    const [currentModel, setCurrentModel] = useState('gemma2:2b')
    const [ollamaModels, setOllamaModels] = useState<Array<{ id: string, name: string }>>([])
    const recognitionRef = useRef<any>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 加载配置和模型
    useEffect(() => {
        const initConfig = async () => {
            try {
                const config = await window.api.getAllConfig()
                if (config.selectedProvider) setCurrentProvider(config.selectedProvider)
                if (config.selectedModel) setCurrentModel(config.selectedModel)

                // 如果是 Ollama，加载模型列表
                if (config.ollamaBaseUrl) {
                    const result = await window.api.listOllamaModels(config.ollamaBaseUrl)
                    if (result.success && result.models) {
                        setOllamaModels(result.models.map((m: any) => ({ id: m.name, name: m.name })))
                    }
                }
            } catch (error) {
                console.error('Failed to load config:', error)
            }
        }
        initConfig()
    }, [isSettingsOpen]) // 设置关闭时重新加载配置

    // 语音识别初始化
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'zh-CN' // 默认中文，可配置

            recognition.onresult = (event: any) => {
                let finalTranscript = ''
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript
                    }
                }
                if (finalTranscript) {
                    setInput(prev => prev + finalTranscript)
                }
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error)
                setIsListening(false)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            recognitionRef.current?.start()
            setIsListening(true)
        }
    }

    const handleImageSelect = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = () => {
        setSelectedImage(null)
    }

    const handleModelChange = async (provider: string, model: string) => {
        try {
            await window.api.setConfig('selectedProvider', provider)
            await window.api.setConfig('selectedModel', model)
            setCurrentProvider(provider as any)
            setCurrentModel(model)
        } catch (error) {
            console.error('Failed to change model:', error)
        }
    }

    const handleStop = () => {
        if (cleanupRef.current) {
            cleanupRef.current()
            cleanupRef.current = null
        }
        setIsTyping(false)
    }

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isTyping) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            images: selectedImage ? [selectedImage] : undefined,
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setSelectedImage(null)
        setIsTyping(true)

        try {
            const aiMsgId = (Date.now() + 1).toString()
            setMessages(prev => [...prev, {
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: Date.now()
            }])

            let aiContent = ''

            const cleanup = window.api.onChunk((chunk: string) => {
                aiContent += chunk
                setMessages(prev =>
                    prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m)
                )
            })
            cleanupRef.current = cleanup

            const result = await window.api.chat([
                ...messages.filter(m => m.id !== 'welcome'),
                userMsg
            ])

            if (!result.success && result.error) {
                setMessages(prev =>
                    prev.map(m => m.id === aiMsgId
                        ? { ...m, content: `❌ Error: ${result.error}\n\nPlease check API key configuration in Settings.` }
                        : m
                    )
                )
            }

            if (cleanup) cleanup()
            cleanupRef.current = null

        } catch (error: any) {
            console.error('AI call failed:', error)
        } finally {
            setIsTyping(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // 获取当前显示的模型名称
    const getCurrentModelName = () => {
        if (currentProvider === 'ollama') return currentModel
        const list = MODELS[currentProvider] || []
        const found = list.find(m => m.id === currentModel)
        return found ? found.name : currentModel
    }

    return (
        <div className="flex flex-col h-full bg-card/50">
            {/* Header with Model Selector */}
            <div className="p-3 border-b border-border font-medium text-sm flex justify-between items-center bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-semibold">Cordex AI</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Model Selector Dropdown */}
                    <div className="relative group">
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary text-xs transition-colors border border-border/50">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="truncate max-w-[150px]">{getCurrentModelName()}</span>
                            <ChevronDown size={12} className="opacity-50" />
                        </button>

                        {/* Dropdown Content */}
                        <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden bg-card">
                            <div className="p-2 max-h-[300px] overflow-y-auto">
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2">Ollama (Local)</div>
                                {ollamaModels.length > 0 ? ollamaModels.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('ollama', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                )) : (
                                    <div className="px-2 py-1 text-xs text-muted-foreground">未检测到模型</div>
                                )}

                                <div className="my-1 border-t border-border"></div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2 mt-1">OpenAI</div>
                                {MODELS.openai.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('openai', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-border"></div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2 mt-1">DeepSeek</div>
                                {MODELS.deepseek.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('deepseek', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-border"></div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2 mt-1">Qwen</div>
                                {MODELS.qwen.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('qwen', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-border"></div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2 mt-1">Gemini</div>
                                {MODELS.gemini.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('gemini', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}

                                <div className="my-1 border-t border-border"></div>
                                <div className="text-xs font-semibold text-muted-foreground mb-1 px-2 mt-1">Anthropic</div>
                                {MODELS.anthropic.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleModelChange('anthropic', m.id)}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent ${currentModel === m.id ? 'bg-accent text-accent-foreground' : ''}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="hover:bg-secondary rounded p-1.5 transition-colors text-muted-foreground hover:text-foreground"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-primary" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary/50 border border-border'
                                }`}
                        >
                            {msg.images && msg.images.map((img, idx) => (
                                <img key={idx} src={img} alt="User upload" className="max-w-full rounded-md mb-2 max-h-[300px]" />
                            ))}
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot size={16} className="text-primary" />
                        </div>
                        <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Cursor-style Input Area */}
            <div className="p-4 bg-background/50 backdrop-blur-sm border-t border-border">
                {selectedImage && (
                    <div className="mb-2 relative inline-block">
                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-border" />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:bg-destructive/90"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                )}
                <div className="relative bg-secondary/30 border border-input rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything... (Ctrl+L)"
                        className="w-full bg-transparent border-none text-sm p-3 min-h-[40px] max-h-[200px] resize-none focus:outline-none placeholder:text-muted-foreground/50"
                        rows={1}
                        style={{ height: 'auto', minHeight: '44px' }}
                    />

                    {/* Toolbar inside input */}
                    <div className="flex items-center justify-between px-2 pb-2">
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors" title="Add Context (@)">
                                <AtSign size={16} />
                            </button>
                            <button
                                onClick={handleImageSelect}
                                className={`p-1.5 rounded-md transition-colors ${selectedImage ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                                title="Add Image"
                            >
                                <ImageIcon size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Voice Input Button */}
                            <button
                                onClick={toggleListening}
                                className={`p-2 rounded-full transition-all ${isListening
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                    }`}
                                title={isListening ? "Stop Listening" : "Start Voice Input"}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>

                            {isTyping ? (
                                <button
                                    onClick={handleStop}
                                    className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                                    title="Stop Generation"
                                >
                                    <Square size={16} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() && !selectedImage}
                                    className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-[10px] text-center text-muted-foreground mt-2">
                    AI can make mistakes. Please review generated code.
                </div>
            </div>

            {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}
        </div>
    )
}

export default ChatInterface
