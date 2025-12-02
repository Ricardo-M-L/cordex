import React, { useState } from 'react'
import MainLayout from './components/Layout/MainLayout'
import CodeEditor from './components/Editor/CodeEditor'
import FileTree, { FileNode } from './components/Sidebar/FileTree'
import Tabs, { Tab } from './components/Editor/Tabs'
import ChatInterface from './components/AI/ChatInterface'
import Terminal from './components/Terminal/Terminal'
import { TerminalSquare } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

function App(): JSX.Element {
    const [activeFileId, setActiveFileId] = useState<string | undefined>()
    const [tabs, setTabs] = useState<Tab[]>([])
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [isTerminalOpen, setIsTerminalOpen] = useState(true)

    const handleOpenFolder = async () => {
        const path = await window.api.openDirectory()
        if (path) {
            const files = await window.api.readDir(path)
            const nodes: FileNode[] = files.map(f => ({
                id: f.path,
                name: f.name,
                type: f.isDirectory ? 'folder' : 'file',
                children: f.isDirectory ? [] : undefined,
                isOpen: false
            }))
            setFileTree(nodes)
            setTabs([])
            setActiveFileId(undefined)
        }
    }

    const handleToggleFolder = async (folder: FileNode) => {
        const newTree = [...fileTree]

        const toggleNode = async (nodes: FileNode[]): Promise<FileNode[]> => {
            return Promise.all(nodes.map(async (node) => {
                if (node.id === folder.id) {
                    if (!node.isOpen && node.children && node.children.length === 0) {
                        const files = await window.api.readDir(node.id)
                        const children: FileNode[] = files.map(f => ({
                            id: f.path,
                            name: f.name,
                            type: f.isDirectory ? 'folder' : 'file',
                            children: f.isDirectory ? [] : undefined,
                            isOpen: false
                        }))
                        return { ...node, isOpen: true, children }
                    }
                    return { ...node, isOpen: !node.isOpen }
                } else if (node.children) {
                    return { ...node, children: await toggleNode(node.children) }
                }
                return node
            }))
        }

        setFileTree(await toggleNode(newTree))
    }

    const handleFileSelect = async (file: FileNode) => {
        if (!tabs.find(t => t.id === file.id)) {
            const content = await window.api.readFile(file.id)
            const newTab: Tab = {
                id: file.id,
                title: file.name,
                path: file.id,
                isActive: true,
                content
            }
            setTabs(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTab))
        } else {
            setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === file.id })))
        }
        setActiveFileId(file.id)
    }

    const handleTabClick = (id: string) => {
        setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === id })))
        setActiveFileId(id)
    }

    const handleTabClose = (id: string) => {
        const newTabs = tabs.filter(t => t.id !== id)
        setTabs(newTabs)
        if (activeFileId === id && newTabs.length > 0) {
            const lastTab = newTabs[newTabs.length - 1]
            lastTab.isActive = true
            setActiveFileId(lastTab.id)
        } else if (newTabs.length === 0) {
            setActiveFileId(undefined)
        }
    }

    return (
        <MainLayout
            sidebar={
                <>
                    <div className="p-2">
                        <button
                            onClick={handleOpenFolder}
                            className="w-full py-1 px-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded border border-primary/20 transition-colors"
                        >
                            Open Folder
                        </button>
                    </div>
                    <FileTree
                        files={fileTree}
                        onFileSelect={handleFileSelect}
                        onFolderToggle={handleToggleFolder}
                        selectedFileId={activeFileId}
                    />
                </>
            }
            panel={<ChatInterface />}
        >
            <div className="flex flex-col h-full">
                <Tabs tabs={tabs} onTabClick={handleTabClick} onTabClose={handleTabClose} />
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 relative min-h-0">
                        {activeFileId ? (
                            <CodeEditor
                                key={activeFileId}
                                initialValue={tabs.find(t => t.id === activeFileId)?.content || ''}
                                language={activeFileId.endsWith('.ts') || activeFileId.endsWith('.tsx') ? 'typescript' : 'javascript'}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
                                <div className="text-4xl">👋</div>
                                <p>打开文件夹开始编码</p>
                                <button
                                    onClick={handleOpenFolder}
                                    className="py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                    打开文件夹
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Terminal Panel - Temporarily disabled due to node-pty compatibility */}
                    {/*
                    <div className={cn("border-t border-border flex flex-col", isTerminalOpen ? "h-48" : "h-8")}>
                        <div 
                            className="flex items-center px-4 h-8 bg-secondary/30 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                        >
                            <TerminalSquare size={14} className="mr-2" />
                            <span className="text-xs font-medium uppercase">终端</span>
                        </div>
                        {isTerminalOpen && (
                            <div className="flex-1 min-h-0">
                                <Terminal />
                            </div>
                        )}
                    </div>
                    */}
                </div>
            </div>
        </MainLayout>
    )
}

export default App
