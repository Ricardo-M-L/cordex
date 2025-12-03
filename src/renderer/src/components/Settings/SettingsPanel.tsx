import React, { useState, useEffect } from 'react'
import { Settings, Key, X, RefreshCw, User, Zap, FileText, Network, Code, Keyboard, Layout, Sparkles, Package } from 'lucide-react'
import PluginManager from './PluginManager'

const models = {
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
    ollama: [] as Array<{ id: string, name: string }>
}

interface SettingsPanelProps {
    onClose: () => void
}

type TabType = 'general' | 'models' | 'editor' | 'shortcuts' | 'plugins' | 'advanced'

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('general')
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'ollama' | 'deepseek' | 'qwen' | 'gemini'>('ollama')
    const [model, setModel] = useState('')
    const [openaiKey, setOpenaiKey] = useState('')
    const [anthropicKey, setAnthropicKey] = useState('')
    const [deepseekKey, setDeepseekKey] = useState('')
    const [qwenKey, setQwenKey] = useState('')
    const [geminiKey, setGeminiKey] = useState('')
    const [ollamaUrl, setOllamaUrl] = useState('http://binary.xin:11434')
    const [ollamaModels, setOllamaModels] = useState<Array<{ id: string, name: string }>>([])
    const [loading, setLoading] = useState(true)
    const [loadingModels, setLoadingModels] = useState(false)

    // 新增设置项
    const [defaultLayout, setDefaultLayout] = useState<'agent' | 'editor'>('agent')
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [fontSize, setFontSize] = useState(14)
    const [autoSave, setAutoSave] = useState(true)
    const [enableSuggestions, setEnableSuggestions] = useState(true)

    useEffect(() => {
        loadConfig()
    }, [])

    useEffect(() => {
        if (provider === 'ollama') {
            if (ollamaModels.length > 0 && !ollamaModels.find(m => m.id === model)) {
                setModel(ollamaModels[0].id)
            }
        } else if (provider && models[provider].length > 0) {
            const firstModel = models[provider][0].id
            if (!model || !models[provider].find(m => m.id === model)) {
                setModel(firstModel)
            }
        }
    }, [provider, ollamaModels])

    const loadConfig = async () => {
        try {
            const config = await window.api.getAllConfig()
            setProvider(config.selectedProvider || 'ollama')
            setModel(config.selectedModel || 'gemma2:2b')
            setOpenaiKey(config.openaiApiKey || '')
            setAnthropicKey(config.anthropicApiKey || '')
            setDeepseekKey(config.deepseekApiKey || '')
            setQwenKey(config.qwenApiKey || '')
            setGeminiKey(config.geminiApiKey || '')
            setOllamaUrl(config.ollamaBaseUrl || 'http://binary.xin:11434')

            if (config.selectedProvider === 'ollama' && config.ollamaBaseUrl) {
                await loadOllamaModels(config.ollamaBaseUrl)
            }
        } catch (error) {
            console.error('Failed to load config:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadOllamaModels = async (baseUrl: string) => {
        setLoadingModels(true)
        try {
            const result = await window.api.listOllamaModels(baseUrl)
            if (result.success && result.models) {
                const modelList = result.models.map((m: any) => ({
                    id: m.name,
                    name: m.name
                }))
                setOllamaModels(modelList)
            } else {
                console.error('Failed to load models:', result.error)
                alert(`无法加载模型列表: ${result.error}`)
            }
        } catch (error: any) {
            console.error('Failed to load Ollama models:', error)
            alert(`连接 Ollama 服务器失败: ${error.message}`)
        } finally {
            setLoadingModels(false)
        }
    }

    const handleSave = async () => {
        try {
            await window.api.setConfig('selectedProvider', provider)
            await window.api.setConfig('selectedModel', model)
            if (openaiKey) await window.api.setConfig('openaiApiKey', openaiKey.trim())
            if (anthropicKey) await window.api.setConfig('anthropicApiKey', anthropicKey.trim())
            if (deepseekKey) await window.api.setConfig('deepseekApiKey', deepseekKey.trim())
            if (qwenKey) await window.api.setConfig('qwenApiKey', qwenKey.trim())
            if (geminiKey) await window.api.setConfig('geminiApiKey', geminiKey.trim())
            if (ollamaUrl) await window.api.setConfig('ollamaBaseUrl', ollamaUrl.trim())
            onClose()
        } catch (error) {
            console.error('Failed to save config:', error)
            alert('保存配置失败，请重试')
        }
    }

    const tabs = [
        { id: 'general' as TabType, name: '通用设置', icon: Settings },
        { id: 'models' as TabType, name: '模型配置', icon: Sparkles },
        { id: 'editor' as TabType, name: '编辑器', icon: Code },
        { id: 'shortcuts' as TabType, name: '快捷键', icon: Keyboard },
        { id: 'plugins' as TabType, name: '插件', icon: Package },
        { id: 'advanced' as TabType, name: '高级设置', icon: Zap }
    ]

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6">
                    <p>加载中...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-lg w-[800px] h-[600px] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings size={20} />
                        Cordex 设置
                    </h2>
                    <button onClick={onClose} className="hover:bg-secondary rounded p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-48 border-r border-border p-2 overflow-y-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-secondary text-muted-foreground'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">通用设置</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">默认布局</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setDefaultLayout('agent')}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${defaultLayout === 'agent'
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="text-center">
                                                        <Sparkles className="mx-auto mb-1" size={20} />
                                                        <div className="font-medium">Agent</div>
                                                        <div className="text-xs text-muted-foreground">AI 对话优先</div>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setDefaultLayout('editor')}
                                                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${defaultLayout === 'editor'
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="text-center">
                                                        <Code className="mx-auto mb-1" size={20} />
                                                        <div className="font-medium">Editor</div>
                                                        <div className="text-xs text-muted-foreground">编辑器优先</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">主题</label>
                                            <select
                                                value={theme}
                                                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
                                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                            >
                                                <option value="dark">深色主题</option>
                                                <option value="light">浅色主题</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">自动保存</div>
                                                <div className="text-xs text-muted-foreground">编辑时自动保存文件</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoSave}
                                                    onChange={(e) => setAutoSave(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Models Tab */}
                        {activeTab === 'models' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">AI 模型配置</h3>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-2">AI 提供商</label>
                                        <select
                                            value={provider}
                                            onChange={(e) => setProvider(e.target.value as any)}
                                            className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                        >
                                            <option value="ollama">Ollama (本地/自建)</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="anthropic">Anthropic (Claude)</option>
                                            <option value="deepseek">DeepSeek</option>
                                            <option value="qwen">Qwen (通义千问)</option>
                                            <option value="gemini">Google Gemini</option>
                                        </select>
                                    </div>

                                    {/* Ollama Config */}
                                    {provider === 'ollama' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">服务器地址</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={ollamaUrl}
                                                        onChange={(e) => setOllamaUrl(e.target.value)}
                                                        placeholder="http://binary.xin:11434"
                                                        className="flex-1 bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                    />
                                                    <button
                                                        onClick={() => loadOllamaModels(ollamaUrl)}
                                                        disabled={loadingModels}
                                                        className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                                                    >
                                                        <RefreshCw size={14} className={loadingModels ? 'animate-spin' : ''} />
                                                        刷新
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    disabled={ollamaModels.length === 0}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm disabled:opacity-50"
                                                >
                                                    {ollamaModels.length === 0 ? (
                                                        <option value="">点击"刷新"加载模型列表</option>
                                                    ) : (
                                                        ollamaModels.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* OpenAI Config */}
                                    {provider === 'openai' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                >
                                                    {models[provider].map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Key size={14} />
                                                    OpenAI API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={openaiKey}
                                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    获取 API 密钥：<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Anthropic Config */}
                                    {provider === 'anthropic' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                >
                                                    {models[provider].map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Key size={14} />
                                                    Anthropic API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={anthropicKey}
                                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                                    placeholder="sk-ant-..."
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    获取 API 密钥：<a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* DeepSeek Config */}
                                    {provider === 'deepseek' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                >
                                                    {models[provider].map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Key size={14} />
                                                    DeepSeek API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={deepseekKey}
                                                    onChange={(e) => setDeepseekKey(e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    获取 API 密钥：<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.deepseek.com</a>
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Qwen Config */}
                                    {provider === 'qwen' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                >
                                                    {models[provider].map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Key size={14} />
                                                    Qwen API Key (DashScope)
                                                </label>
                                                <input
                                                    type="password"
                                                    value={qwenKey}
                                                    onChange={(e) => setQwenKey(e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    获取 API 密钥：<a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">阿里云百炼控制台</a>
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Gemini Config */}
                                    {provider === 'gemini' && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">模型</label>
                                                <select
                                                    value={model}
                                                    onChange={(e) => setModel(e.target.value)}
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                >
                                                    {models[provider].map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                                    <Key size={14} />
                                                    Gemini API Key
                                                </label>
                                                <input
                                                    type="password"
                                                    value={geminiKey}
                                                    onChange={(e) => setGeminiKey(e.target.value)}
                                                    placeholder="..."
                                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    获取 API 密钥：<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Editor Tab */}
                        {activeTab === 'editor' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">编辑器设置</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">字体大小</label>
                                            <input
                                                type="number"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(Number(e.target.value))}
                                                min="10"
                                                max="24"
                                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">代码建议</div>
                                                <div className="text-xs text-muted-foreground">启用 AI 代码建议</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={enableSuggestions}
                                                    onChange={(e) => setEnableSuggestions(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shortcuts Tab */}
                        {activeTab === 'shortcuts' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">快捷键配置</h3>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                                            <span className="text-sm">打开设置</span>
                                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Cmd + ,</kbd>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                                            <span className="text-sm">新建文件</span>
                                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Cmd + N</kbd>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                                            <span className="text-sm">保存文件</span>
                                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Cmd + S</kbd>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                                            <span className="text-sm">AI 对话</span>
                                            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Cmd + L</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Tab */}
                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">高级设置</h3>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-secondary/50 rounded-lg">
                                            <div className="font-medium mb-2">网络代理</div>
                                            <input
                                                type="text"
                                                placeholder="http://proxy.example.com:8080"
                                                className="w-full bg-background border border-input rounded px-3 py-2 text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">配置 HTTP 代理服务器</p>
                                        </div>

                                        <div className="p-4 bg-secondary/50 rounded-lg">
                                            <div className="font-medium mb-2">数据存储位置</div>
                                            <div className="text-sm text-muted-foreground">
                                                ~/Library/Application Support/cordex
                                            </div>
                                        </div>

                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                            <div className="font-medium text-destructive mb-2">危险区域</div>
                                            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
                                                重置所有设置
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Plugins Tab */}
                        {activeTab === 'plugins' && (
                            <PluginManager />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 justify-end p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-secondary rounded hover:bg-secondary/80 text-sm transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPanel
