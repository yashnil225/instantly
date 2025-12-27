"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcut {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    action: () => void
    description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return
        
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Allow Escape to work in inputs
            if (event.key !== 'Escape') return
        }

        for (const shortcut of shortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
            const altMatch = shortcut.alt ? event.altKey : !event.altKey

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault()
                shortcut.action()
                break
            }
        }
    }, [shortcuts, enabled])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Common shortcuts that can be reused
export const COMMON_SHORTCUTS = {
    NEW: { key: 'n', ctrl: true, description: 'Create new' },
    SEARCH: { key: 'f', ctrl: true, description: 'Focus search' },
    DELETE: { key: 'Delete', description: 'Delete selected' },
    ESCAPE: { key: 'Escape', description: 'Close modal / Clear selection' },
    SAVE: { key: 's', ctrl: true, description: 'Save' },
    TOGGLE_VIEW: { key: 'g', ctrl: true, description: 'Toggle view' },
    SELECT_ALL: { key: 'a', ctrl: true, description: 'Select all' },
}
