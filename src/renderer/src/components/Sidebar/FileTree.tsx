import React, { useState } from 'react'
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface FileNode {
    id: string
    name: string
    type: 'file' | 'folder'
    children?: FileNode[]
    isOpen?: boolean
}



interface FileTreeProps {
    files: FileNode[]
    onFileSelect: (file: FileNode) => void
    onFolderToggle: (folder: FileNode) => void
    selectedFileId?: string
}

const FileTreeNode: React.FC<{
    node: FileNode
    level: number
    onSelect: (node: FileNode) => void
    onToggle: (node: FileNode) => void
    selectedId?: string
}> = ({ node, level, onSelect, onToggle, selectedId }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (node.type === 'folder') {
            onToggle(node)
        } else {
            onSelect(node)
        }
    }

    return (
        <div>
            <div
                className={cn(
                    "flex items-center py-1 px-2 cursor-pointer hover:bg-secondary/50 text-sm select-none",
                    selectedId === node.id && "bg-secondary text-accent-foreground"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                <span className="mr-1 opacity-70">
                    {node.type === 'folder' ? (
                        node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="w-[14px]" />
                    )}
                </span>
                <span className="mr-2 text-muted-foreground">
                    {node.type === 'folder' ? (
                        node.isOpen ? <FolderOpen size={14} /> : <Folder size={14} />
                    ) : (
                        <FileCode size={14} />
                    )}
                </span>
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && node.isOpen && node.children?.map(child => (
                <FileTreeNode
                    key={child.id}
                    node={child}
                    level={level + 1}
                    onSelect={onSelect}
                    onToggle={onToggle}
                    selectedId={selectedId}
                />
            ))}
        </div>
    )
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, onFolderToggle, selectedFileId }) => {
    return (
        <div className="w-full">
            {files.map(node => (
                <FileTreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    onSelect={onFileSelect}
                    onToggle={onFolderToggle}
                    selectedId={selectedFileId}
                />
            ))}
        </div>
    )
}

export default FileTree
