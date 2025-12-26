
import { useState, useRef, useEffect } from "react"
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered,
    Link as LinkIcon, Image as ImageIcon,
    Eraser, Code, Plus,
    ALargeSmall
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface RichEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    leftActions?: React.ReactNode
}

export function RichEditor({ value, onChange, placeholder, leftActions }: RichEditorProps) {
    const [isCodeView, setIsCodeView] = useState(false)
    const [showFormatting, setShowFormatting] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)

    // Sync external value changes to editor (only if not focused or specialized)
    useEffect(() => {
        if (editorRef.current && !isCodeView && document.activeElement !== editorRef.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value
            }
        }
    }, [value, isCodeView])

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value)
        handleChange()
    }

    const handleChange = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML)
        }
    }

    const insertHtml = (html: string) => {
        if (isCodeView) return // Can't insert HTML via execCommand in code view

        const selection = window.getSelection()
        if (!selection || !selection.rangeCount) return

        const range = selection.getRangeAt(0)

        // Ensure selection is inside editor
        if (editorRef.current && !editorRef.current.contains(range.commonAncestorContainer)) {
            editorRef.current.focus()
            // Move to end if specific range not found in editor
        }

        document.execCommand('insertHTML', false, html)
        handleChange()
    }

    const cleanHtml = () => {
        if (editorRef.current) {
            const text = editorRef.current.innerText
            editorRef.current.innerHTML = text
            handleChange()
        }
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto relative min-h-[300px] outline-none">
                {isCodeView ? (
                    <textarea
                        className="w-full h-full bg-[#0a0a0a] text-gray-300 font-mono text-sm p-6 resize-none outline-none border-none"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <div
                        ref={editorRef}
                        contentEditable
                        className="w-full h-full text-gray-300 p-6 outline-none focus:outline-none whitespace-pre-wrap font-sans text-base leading-relaxed"
                        onInput={handleChange}
                        onBlur={handleChange}
                        style={{ minHeight: '100%' }}
                        data-placeholder={placeholder}
                    />
                )}
            </div>

            {/* Formatting Toolbar (Conditional) */}
            {showFormatting && (
                <div className="px-4 py-2 border-t border-[#222] bg-[#0f0f0f] flex items-center gap-1 overflow-x-auto select-none animate-in slide-in-from-bottom-2 duration-200">
                    <ToolbarBtn icon={Bold} onClick={() => exec('bold')} tooltip="Bold (Ctrl+B)" />
                    <ToolbarBtn icon={Italic} onClick={() => exec('italic')} tooltip="Italic (Ctrl+I)" />
                    <ToolbarBtn icon={Underline} onClick={() => exec('underline')} tooltip="Underline (Ctrl+U)" />
                    <ToolbarBtn icon={Strikethrough} onClick={() => exec('strikeThrough')} tooltip="Strikethrough" />

                    <div className="w-[1px] h-5 bg-[#333] mx-2" />
                    
                    <ToolbarBtn icon={AlignLeft} onClick={() => exec('justifyLeft')} tooltip="Align Left" />
                    <ToolbarBtn icon={AlignCenter} onClick={() => exec('justifyCenter')} tooltip="Align Center" />
                    <ToolbarBtn icon={AlignRight} onClick={() => exec('justifyRight')} tooltip="Align Right" />

                    <div className="w-[1px] h-5 bg-[#333] mx-2" />

                    <ToolbarBtn icon={List} onClick={() => exec('insertUnorderedList')} tooltip="Bullet List" />
                    <ToolbarBtn icon={ListOrdered} onClick={() => exec('insertOrderedList')} tooltip="Ordered List" />
                </div>
            )}

            {/* Main Action Bar */}
            <div className="px-4 py-3 border-t border-[#222] bg-[#0a0a0a] flex items-center justify-between gap-2 overflow-x-auto select-none">
                {/* Left Actions & Formatting Toggle */}
                <div className="flex items-center gap-3">
                    {leftActions}
                    
                    <div className="w-[1px] h-5 bg-[#333] mx-1" />
                    
                    <ToolbarBtn 
                        icon={ALargeSmall} 
                        onClick={() => setShowFormatting(!showFormatting)} 
                        tooltip="Formatting Options" 
                        active={showFormatting}
                    />
                </div>

                {/* Right Side: Insertions */}
                <div className="flex items-center gap-1">
                    <ToolbarBtn icon={Eraser} onClick={cleanHtml} tooltip="Clean HTML (Ctrl+Shift+F)" />
                    
                    <ToolbarBtn icon={LinkIcon} onClick={() => {
                        const url = prompt("Enter Link URL:")
                        if (url) exec('createLink', url)
                    }} tooltip="Insert link (Ctrl+K)" />

                    <ToolbarBtn icon={ImageIcon} onClick={() => {
                        const url = prompt("Enter Image URL:")
                        if (url) exec('insertImage', url)
                    }} tooltip="Insert Image (Ctrl+P)" />

                    <ToolbarBtn icon={Plus} onClick={() => {
                        insertHtml('<a href="{{unsubscribe}}">Unsubscribe</a>')
                    }} tooltip="Insert unsubscribe link" />

                    <div className="w-[1px] h-5 bg-[#333] mx-2" />

                    <ToolbarBtn
                        icon={Code}
                        active={isCodeView}
                        onClick={() => setIsCodeView(!isCodeView)}
                        tooltip="Code View"
                    />
                </div>
            </div>
        </div>
    )
}

function ToolbarBtn({ icon: Icon, onClick, tooltip, active }: { icon: any, onClick: () => void, tooltip: string, active?: boolean }) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <button
                        onClick={onClick}
                        className={cn(
                            "p-2 rounded hover:bg-[#222] text-gray-400 hover:text-white transition-colors",
                            active && "bg-[#222] text-white"
                        )}
                        type="button"
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="bg-black border border-[#333] text-gray-300 text-xs shadow-xl">
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
