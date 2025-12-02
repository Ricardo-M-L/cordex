import React, { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface TerminalProps {
    className?: string
}

const Terminal: React.FC<TerminalProps> = ({ className }) => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const xtermRef = useRef<XTerm | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)

    useEffect(() => {
        if (!terminalRef.current) return

        const term = new XTerm({
            cursorBlink: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 14,
            theme: {
                background: '#0f1117',
                foreground: '#cccccc',
                cursor: '#ffffff',
                selectionBackground: '#264f78',
                black: '#000000',
                red: '#cd3131',
                green: '#0dbc79',
                yellow: '#e5e510',
                blue: '#2472c8',
                magenta: '#bc3fbc',
                cyan: '#11a8cd',
                white: '#e5e5e5',
                brightBlack: '#666666',
                brightRed: '#f14c4c',
                brightGreen: '#23d18b',
                brightYellow: '#f5f543',
                brightBlue: '#3b8eea',
                brightMagenta: '#d670d6',
                brightCyan: '#29b8db',
                brightWhite: '#e5e5e5'
            }
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)

        term.open(terminalRef.current)
        fitAddon.fit()

        // Initialize backend terminal
        window.api.createTerminal()

        term.onData(data => {
            window.api.writeTerminal(data)
        })

        xtermRef.current = term
        fitAddonRef.current = fitAddon

        // Listen for incoming data from main process
        const handleIncomingData = (_: any, data: string) => {
            term.write(data)
        }

        window.electron.ipcRenderer.on('terminal:data', handleIncomingData)

        const handleResize = () => {
            fitAddon.fit()
            if (xtermRef.current) {
                const { cols, rows } = fitAddon.proposeDimensions() || { cols: 80, rows: 24 }
                window.api.resizeTerminal(cols, rows)
            }
        }

        window.addEventListener('resize', handleResize)

        // Initial resize
        setTimeout(handleResize, 100)

        return () => {
            term.dispose()
            window.electron.ipcRenderer.removeAllListeners('terminal:data')
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return <div ref={terminalRef} className={cn("h-full w-full overflow-hidden bg-[#0f1117] p-2", className)} />
}

export default Terminal
