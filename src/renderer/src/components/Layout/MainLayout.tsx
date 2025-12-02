import React from 'react'

interface MainLayoutProps {
    children: React.ReactNode
    sidebar?: React.ReactNode
    panel?: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, sidebar, panel }) => {
    return (
        <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar (File Explorer) */}
            <aside className="w-64 border-r border-border flex-shrink-0 flex flex-col">
                <div className="p-4 border-b border-border font-semibold text-sm tracking-wide text-muted-foreground uppercase">
                    Explorer
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {sidebar || <div className="text-xs text-muted-foreground p-2">No folder opened</div>}
                </div>
            </aside>

            {/* Main Content (Editor) */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Tabs Header (Placeholder) */}
                <div className="h-9 border-b border-border flex items-center bg-secondary/30 px-2">
                    <div className="px-3 py-1 bg-background text-xs border-t-2 border-primary rounded-t-sm">
                        index.tsx
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative">
                    {children}
                </div>
            </main>

            {/* Right Panel (AI Assistant) */}
            <aside className="w-80 border-l border-border flex-shrink-0 flex flex-col bg-card/50">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {panel || (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                ✨
                            </div>
                            <p className="text-sm">How can I help you code today?</p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    )
}

export default MainLayout
