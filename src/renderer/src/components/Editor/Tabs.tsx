import React from 'react'
import { X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface Tab {
    id: string
    title: string
    path: string
    isActive: boolean
    isDirty?: boolean
    content?: string
}

interface TabsProps {
    tabs: Tab[]
    onTabClick: (id: string) => void
    onTabClose: (id: string) => void
}

const Tabs: React.FC<TabsProps> = ({ tabs, onTabClick, onTabClose }) => {
    return (
        <div className="flex items-center bg-secondary/20 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={cn(
                        "group flex items-center min-w-[120px] max-w-[200px] h-9 px-3 border-r border-border cursor-pointer text-xs select-none hover:bg-secondary/40",
                        tab.isActive && "bg-background border-t-2 border-t-primary"
                    )}
                    onClick={() => onTabClick(tab.id)}
                >
                    <span className={cn(
                        "flex-1 truncate mr-2",
                        tab.isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {tab.title}
                    </span>
                    <button
                        className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation()
                            onTabClose(tab.id)
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
    )
}

export default Tabs
