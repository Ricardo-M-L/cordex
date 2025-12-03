import React, { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Power, Download, Search } from 'lucide-react'

interface Plugin {
    id: string
    name: string
    version: string
    enabled: boolean
    author?: string
    description?: string
}

const PluginManager: React.FC = () => {
    const [plugins, setPlugins] = useState<Plugin[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [newPlugin, setNewPlugin] = useState({
        id: '',
        name: '',
        version: '1.0.0',
        author: '',
        description: ''
    })

    useEffect(() => {
        loadPlugins()
    }, [])

    const loadPlugins = async () => {
        try {
            const result = await window.api.listPlugins()
            if (result.success) {
                setPlugins(result.plugins || [])
            }
        } catch (error) {
            console.error('Failed to load plugins:', error)
        }
    }

    const handleAddPlugin = async () => {
        if (!newPlugin.id || !newPlugin.name) {
            alert('请填写插件 ID 和名称')
            return
        }

        try {
            const plugin: Plugin = {
                ...newPlugin,
                enabled: true
            }

            const result = await window.api.addPlugin(plugin)
            if (result.success) {
                await loadPlugins()
                setShowAddDialog(false)
                setNewPlugin({
                    id: '',
                    name: '',
                    version: '1.0.0',
                    author: '',
                    description: ''
                })
            }
        } catch (error) {
            console.error('Failed to add plugin:', error)
            alert('添加插件失败')
        }
    }

    const handleRemovePlugin = async (pluginId: string) => {
        if (!confirm('确定要删除这个插件吗？')) return

        try {
            const result = await window.api.removePlugin(pluginId)
            if (result.success) {
                await loadPlugins()
            }
        } catch (error) {
            console.error('Failed to remove plugin:', error)
            alert('删除插件失败')
        }
    }

    const handleTogglePlugin = async (pluginId: string) => {
        try {
            const result = await window.api.togglePlugin(pluginId)
            if (result.success) {
                await loadPlugins()
            }
        } catch (error) {
            console.error('Failed to toggle plugin:', error)
            alert('切换插件状态失败')
        }
    }

    const filteredPlugins = plugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">插件管理</h3>
                    <p className="text-sm text-muted-foreground">扩展 Cordex 的功能</p>
                </div>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
                >
                    <Plus size={16} />
                    添加插件
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="搜索插件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-secondary border border-input rounded-lg text-sm"
                />
            </div>

            {/* Plugin List */}
            <div className="space-y-2">
                {filteredPlugins.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm">暂无插件</p>
                        <p className="text-xs mt-1">点击"添加插件"开始</p>
                    </div>
                ) : (
                    filteredPlugins.map(plugin => (
                        <div
                            key={plugin.id}
                            className="p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{plugin.name}</h4>
                                        <span className="text-xs px-2 py-0.5 bg-background border border-border rounded">
                                            v{plugin.version}
                                        </span>
                                        {plugin.enabled ? (
                                            <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded">
                                                已启用
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded">
                                                已禁用
                                            </span>
                                        )}
                                    </div>
                                    {plugin.author && (
                                        <p className="text-xs text-muted-foreground mb-1">
                                            作者: {plugin.author}
                                        </p>
                                    )}
                                    {plugin.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {plugin.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleTogglePlugin(plugin.id)}
                                        className={`p-2 rounded-lg transition-colors ${plugin.enabled
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                : 'bg-secondary hover:bg-secondary/80'
                                            }`}
                                        title={plugin.enabled ? '禁用' : '启用'}
                                    >
                                        <Power size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleRemovePlugin(plugin.id)}
                                        className="p-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Plugin Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddDialog(false)}>
                    <div
                        className="bg-card border border-border rounded-lg p-6 w-[500px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">添加插件</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">插件 ID *</label>
                                <input
                                    type="text"
                                    value={newPlugin.id}
                                    onChange={(e) => setNewPlugin({ ...newPlugin, id: e.target.value })}
                                    placeholder="com.example.myplugin"
                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">插件名称 *</label>
                                <input
                                    type="text"
                                    value={newPlugin.name}
                                    onChange={(e) => setNewPlugin({ ...newPlugin, name: e.target.value })}
                                    placeholder="我的插件"
                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">版本</label>
                                <input
                                    type="text"
                                    value={newPlugin.version}
                                    onChange={(e) => setNewPlugin({ ...newPlugin, version: e.target.value })}
                                    placeholder="1.0.0"
                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">作者</label>
                                <input
                                    type="text"
                                    value={newPlugin.author}
                                    onChange={(e) => setNewPlugin({ ...newPlugin, author: e.target.value })}
                                    placeholder="作者名称"
                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">描述</label>
                                <textarea
                                    value={newPlugin.description}
                                    onChange={(e) => setNewPlugin({ ...newPlugin, description: e.target.value })}
                                    placeholder="插件功能描述"
                                    rows={3}
                                    className="w-full bg-secondary border border-input rounded px-3 py-2 text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end mt-6">
                            <button
                                onClick={() => setShowAddDialog(false)}
                                className="px-4 py-2 bg-secondary rounded hover:bg-secondary/80 text-sm"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAddPlugin}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                            >
                                添加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PluginManager
