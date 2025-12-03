import React, { useState, useEffect } from 'react'
import { Settings, Key, X, RefreshCw } from 'lucide-react'

const models = {
    openai: [
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

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
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

    useEffect(() => {
        loadConfig()
    }, [])

    useEffect(() => {
        // 当切换提供商时，自动选择第一个模型
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

            // 如果是 Ollama，加载模型列表
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
                className="bg-card border border-border rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Settings size={20} />
                        AI 模型设置
                    </h2>
                    <button onClick={onClose} className="hover:bg-secondary rounded p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Provider 选择 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">AI 提供商</label>
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic' | 'ollama')}
                        className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="ollama">Ollama (本地/自建)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="qwen">Qwen (通义千问)</option>
                        <option value="gemini">Google Gemini</option>
                    </select>
                </div>

                {/* Ollama 配置 */}
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
                                    className="flex-1 bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                            <p className="text-xs text-muted-foreground mt-1">
                                您的 Ollama 服务器地址
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">模型</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                disabled={ollamaModels.length === 0}
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
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

                {/* OpenAI 配置 */}
                {provider === 'openai' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">模型</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                获取 API 密钥：<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a>
                            </p>
                        </div>
                    </>
                )}

                {/* Anthropic 配置 */}
                {provider === 'anthropic' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">模型</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                获取 API 密钥：<a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.anthropic.com</a>
                            </p>
                        </div>
                    </>
                )}

                {/* DeepSeek 配置 */}
                {provider === 'deepseek' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">模型</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                获取 API 密钥：<a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.deepseek.com</a>
                            </p>
                        </div>
                    </>
                )}

                {/* Qwen 配置 */}
                {provider === 'qwen' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">模型</label>
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                                className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                获取 API 密钥：<a href="https://bailian.console.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">阿里云百炼控制台</a>
                            </p>
                        </div>
                    </>
                )}

                {/* 按钮 */}
                <div className="flex gap-2 justify-end mt-6">
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
