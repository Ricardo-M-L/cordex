import React from 'react'
import Editor, { OnMount, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

loader.config({ monaco })

interface CodeEditorProps {
    initialValue?: string
    language?: string
    theme?: string
    onChange?: (value: string | undefined) => void
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    initialValue = '// Welcome to Cordex',
    language = 'typescript',
    theme = 'vs-dark',
    onChange
}) => {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Define Cordex theme
        monaco.editor.defineTheme('cordex-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0f1117', // Deep navy/black
                'editor.lineHighlightBackground': '#1a1d26',
                'editorLineNumber.foreground': '#4b5563',
            }
        })
        monaco.editor.setTheme('cordex-dark')
    }

    return (
        <div className="h-full w-full overflow-hidden">
            <Editor
                height="100%"
                defaultLanguage={language}
                defaultValue={initialValue}
                theme={theme}
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                }}
            />
        </div>
    )
}

export default CodeEditor
