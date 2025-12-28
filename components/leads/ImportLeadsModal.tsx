"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Check, FileText, Search, Mail, Loader2, ChevronLeft, ArrowRight } from "lucide-react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

interface ImportLeadsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImportSuccess: () => void
}

type Step = 'source' | 'csv_choice' | 'csv' | 'sheets' | 'manual' | 'mapping'

const SYSTEM_FIELDS = [
    { value: "email", label: "Email" },
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "company", label: "Company Name" },
    { value: "custom", label: "Custom Variable" },
    { value: "skip", label: "Do not import" },
]

export function ImportLeadsModal({ open, onOpenChange, onImportSuccess }: ImportLeadsModalProps) {
    const params = useParams()
    const { data: session } = useSession()
    const [step, setStep] = useState<Step>('source')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sheetsUrl, setSheetsUrl] = useState('')
    const [manualEmails, setManualEmails] = useState('')

    // Mapping State
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [firstRowSample, setFirstRowSample] = useState<string[]>([])
    const [parsedData, setParsedData] = useState<any[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

    // Google Picker
    const [pickerLoaded, setPickerLoaded] = useState(false)

    useEffect(() => {
        const loadPicker = () => {
            const script = document.createElement("script")
            script.src = "https://apis.google.com/js/api.js"
            script.onload = () => {
                const gapi = (window as any).gapi
                gapi.load('client:picker', () => {
                    setPickerLoaded(true)
                })
            }
            document.body.appendChild(script)
        }
        loadPicker()
    }, [])

    const handleGoogleDriveSelect = () => {
        const accessToken = (session as any)?.accessToken
        if (!accessToken) {
            setError("Google login required to browse Drive")
            return
        }

        const gapi = (window as any).gapi
        const google = (window as any).google

        const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
            .setMimeTypes('application/vnd.google-apps.spreadsheet')

        const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    const doc = data.docs[0]
                    setSheetsUrl(doc.url)
                    // We can also use doc.id directly in the future
                }
            })
            .build()
        picker.setVisible(true)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const processFile = (file: File) => {
        setFile(file)
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

        if (isExcel) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = e.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

                if (json.length > 0) {
                    const headers = json[0].map(h => String(h))
                    setCsvHeaders(headers)
                    if (json.length > 1) {
                        setFirstRowSample(json[1].map(v => String(v || '')))
                    }

                    // Convert to object array for compatibility
                    const rows = json.slice(1).map(row => {
                        const obj: any = {}
                        headers.forEach((h, i) => obj[h] = row[i])
                        return obj
                    })
                    setParsedData(rows)
                    autoMap(headers)
                    setStep('mapping')
                }
            }
            reader.readAsBinaryString(file)
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                preview: 5,
                complete: (results) => {
                    if (results.meta.fields) {
                        setCsvHeaders(results.meta.fields)
                        if (results.data.length > 0) {
                            const firstRow = results.data[0] as any
                            const sample = results.meta.fields.map(h => String(firstRow[h] || ''))
                            setFirstRowSample(sample)
                        }
                        autoMap(results.meta.fields)
                        setStep('mapping')
                    }
                }
            })
        }
    }

    const autoMap = (headers: string[]) => {
        const initialMapping: Record<string, string> = {}
        headers.forEach(header => {
            const lower = header.toLowerCase().replace(/[^a-z]/g, '')
            if (lower.includes('email')) initialMapping[header] = 'email'
            else if (lower.includes('first')) initialMapping[header] = 'firstName'
            else if (lower.includes('last')) initialMapping[header] = 'lastName'
            else if (lower.includes('company') || lower.includes('organization') || lower.includes('org')) initialMapping[header] = 'company'
            else if (lower.includes('skip')) initialMapping[header] = 'skip'
            else initialMapping[header] = 'custom' // Default to custom instead of skip for better data retention
        })
        setColumnMapping(initialMapping)
    }

    const handleUploadWithMapping = async () => {
        if (!params.id) return

        // Helper to process raw data array
        const processAndUpload = async (rawData: any[]) => {
            try {
                const mappedLeads = rawData.map((row: any) => {
                    const lead: any = { email: '', firstName: '', lastName: '', company: '', customFields: {} }
                    Object.keys(row).forEach((header) => {
                        const targetField = columnMapping[header]
                        const value = row[header]

                        if (targetField === 'email') lead.email = value
                        else if (targetField === 'firstName') lead.firstName = value
                        else if (targetField === 'lastName') lead.lastName = value
                        else if (targetField === 'company') lead.company = value
                        else if (targetField === 'custom') {
                            lead.customFields[header] = value
                        }
                    })

                    // Ensure customFields is a string or undefined
                    const customFieldsStr = Object.keys(lead.customFields).length > 0
                        ? JSON.stringify(lead.customFields)
                        : null

                    return {
                        email: lead.email,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        company: lead.company,
                        customFields: customFieldsStr
                    }
                }).filter((l: any) => l.email)

                const res = await fetch(`/api/campaigns/${params.id}/leads/import`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'json',
                        leads: mappedLeads
                    }),
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Upload failed")
                }

                onImportSuccess()
                resetAndClose()
            } catch (err: any) {
                setError(err.message)
            } finally {
                setUploading(false)
            }
        }

        setUploading(true)
        setError(null)

        if (file) {
            // Re-parse file if we have one (CSV flow)
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => processAndUpload(results.data)
            })
        } else if (parsedData.length > 0) {
            // Use pre-parsed data (Sheets flow)
            processAndUpload(parsedData)
        }
    }

    // ... (Keep existing simple import handlers for Sheets/Manual) ...
    // Note: Re-implementing them briefly for safety to ensure context is kept

    const handleImportFromSheets = async () => {
        if (!sheetsUrl) return
        setUploading(true)
        setError(null)
        try {
            // 1. Fetch parsed data from our backend helper
            const res = await fetch('/api/leads/import/sheets', {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sheetsUrl, campaignId: params.id }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to fetch sheet")
            }

            const { data } = await res.json() // Expecting { data: [ {col1: val, col2: val}, ... ] }

            if (!data || data.length === 0) throw new Error("Sheet is empty")

            // 2. Prepare for Mapping Step
            // Extract headers from first row keys
            const headers = Object.keys(data[0])
            setCsvHeaders(headers)

            // Set Sample
            const firstRow = data[0]
            const sample = headers.map(h => String(firstRow[h] || ''))
            setFirstRowSample(sample)

            // Auto-guess mapping using centralized logic
            autoMap(headers)

            // 3. Store the full parsed data to use in the final upload
            // We need to store this so handleUploadWithMapping uses it.
            // Currently handleUploadWithMapping re-parses 'file'. We need to support 'parsedData' state.
            setParsedData(data)

            setStep('mapping')

        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleImportManual = async () => {
        if (!manualEmails || !params.id) return
        setUploading(true)
        try {
            const emails = manualEmails.split(/[\n,]/).map(e => e.trim()).filter(e => e.includes('@'))
            const res = await fetch(`/api/campaigns/${params.id}/leads/import`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'manual', emails }),
            })
            if (!res.ok) throw new Error("Import failed")
            onImportSuccess(); resetAndClose()
        } catch (err: any) { setError(err.message) } finally { setUploading(false) }
    }


    const resetAndClose = () => {
        setStep('source')
        setFile(null)
        setError(null)
        setSheetsUrl('')
        setManualEmails('')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else onOpenChange(o) }}>
            <DialogContent className="max-w-4xl bg-[#0a0a0a] border-[#222] text-white p-0 overflow-hidden h-[85vh] max-h-[85vh] flex flex-col">
                <div className="sr-only">
                    <DialogTitle>Import Leads</DialogTitle>
                </div>

                {/* Source Selection */}
                {step === 'source' && (
                    <div className="flex flex-col h-full p-8 items-center justify-center relative flex-1">
                        <div className="space-y-3 w-full max-w-md">
                            <div
                                onClick={() => setStep('csv_choice')}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition-all border border-[#222] hover:border-[#333]"
                            >
                                <div className="h-10 w-10 flex items-center justify-center bg-[#00D4AA] rounded-lg">
                                    <FileText className="h-5 w-5 text-black" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold tracking-widest">UPLOAD</div>
                                    <div className="text-lg font-semibold text-white">CSV</div>
                                </div>
                            </div>

                            <div
                                onClick={() => setStep('manual')}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition-all border border-transparent hover:border-[#333]"
                            >
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-gray-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold tracking-widest">ENTER</div>
                                    <div className="text-lg font-semibold text-white">Emails Manually</div>
                                </div>
                            </div>

                            <div
                                onClick={() => setStep('sheets')}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition-all border border-transparent hover:border-[#333]"
                            >
                                <div className="h-10 w-10 flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 font-bold tracking-widest">USE</div>
                                    <div className="text-lg font-semibold text-white">Google Sheets</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CSV Choice */}
                {step === 'csv_choice' && (
                    <div className="flex flex-col h-full p-8 items-center justify-center relative flex-1">
                        <Button variant="ghost" onClick={() => setStep('source')} className="absolute top-6 left-6 text-gray-500 hover:text-white pl-0 hover:bg-transparent text-xs">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="space-y-4 w-full max-w-md">
                            <div
                                onClick={() => setStep('csv')}
                                className="group flex items-center gap-4 p-5 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition-all border border-[#222] hover:border-[#333]"
                            >
                                <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-white">Upload from Local File</div>
                                    <div className="text-xs text-gray-400">Import .csv, .xls or .xlsx from your computer</div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
                            </div>

                            <div
                                onClick={() => setStep('sheets')}
                                className="group flex items-center gap-4 p-5 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition-all border border-[#222] hover:border-[#333]"
                            >
                                <div className="h-10 w-10 flex items-center justify-center bg-green-500/10 rounded-lg">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#0F9D58" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-white">Import from Google Sheets</div>
                                    <div className="text-xs text-gray-400">Select a file from Google Drive or paste a public link</div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-green-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                )}

                {/* CSV Upload */}
                {step === 'csv' && (
                    <div className="p-8 flex flex-col h-full flex-1 justify-center items-center">
                        <Button variant="ghost" onClick={() => setStep('csv_choice')} className="absolute top-6 left-6 text-gray-500 hover:text-white pl-0 hover:bg-transparent">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>

                        <h2 className="text-xl font-semibold text-white mb-6">Upload CSV File</h2>

                        <Label
                            htmlFor="csv-upload"
                            className="w-full max-w-md min-h-[250px] border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center hover:border-[#444] hover:bg-[#111] transition-all cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <Upload className="h-10 w-10 text-gray-500 mb-4" />
                            <span className="text-sm font-bold text-gray-500 tracking-widest">TAP TO UPLOAD</span>
                            <span className="text-xs text-gray-600 mt-2">or drag and drop (desktop)</span>
                            <span className="text-xs text-gray-600 mt-1">Supports CSV, XLS, XLSX files</span>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </Label>

                        {/* Explicit button for mobile devices */}
                        <Button
                            variant="outline"
                            className="mt-4 md:hidden border-[#333] text-white hover:bg-[#222]"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                        </Button>
                    </div>
                )}

                {/* Mapping Step */}
                {step === 'mapping' && (
                    <div className="flex flex-col h-full bg-[#0a0a0a]">
                        <div className="p-8 pb-0">
                            <Button variant="ghost" onClick={() => { setStep('csv'); setFile(null) }} className="text-blue-500 hover:text-blue-400 pl-0 hover:bg-transparent mb-4 text-xs font-medium">
                                <ChevronLeft className="h-3 w-3 mr-1" /> Choose another method
                            </Button>

                            <h2 className="text-xl font-semibold text-white mb-6">Upload CSV File</h2>

                            {/* File Info Box */}
                            <div className="border border-dashed border-[#333] rounded-xl p-8 bg-[#0a0a0a] flex flex-col items-center justify-center mb-8 relative">
                                <Button variant="ghost" size="icon" onClick={() => { setStep('csv'); setFile(null) }} className="absolute top-4 right-4 text-gray-500 hover:text-white h-6 w-6 rounded-full bg-[#111] hover:bg-[#222]">
                                    <X className="h-3 w-3" />
                                </Button>
                                <div className="text-xs text-gray-500 font-medium mb-2">
                                    {(file?.size ? (file.size / 1024).toFixed(0) : 0)} KB
                                </div>
                                <div className="text-white font-medium text-center max-w-lg mb-6 text-lg">
                                    {file?.name}
                                </div>
                                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                    <div className="bg-green-500/10 rounded-full p-1"><Check className="h-3 w-3" /></div>
                                    File processed
                                </div>
                            </div>

                            {/* Column Headers */}
                            <div className="grid grid-cols-12 gap-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">
                                <div className="col-span-3">Column Name</div>
                                <div className="col-span-4">Select Type</div>
                                <div className="col-span-5">Samples</div>
                            </div>
                        </div>

                        {/* Scrollable Mapping List */}
                        <div className="flex-1 overflow-y-auto px-8 min-h-0">
                            <div className="space-y-4 pb-4">
                                {csvHeaders.map((header, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-8 items-start py-2 border-b border-[#1a1a1a] last:border-0">
                                        <div className="col-span-3 text-sm font-medium text-gray-300 pt-2.5 break-words">{header}</div>
                                        <div className="col-span-4">
                                            <Select
                                                value={columnMapping[header]}
                                                onValueChange={(val) => setColumnMapping({ ...columnMapping, [header]: val })}
                                            >
                                                <SelectTrigger className="bg-[#111] border-[#2a2a2a] h-10 text-gray-300 focus:ring-0 focus:border-blue-600">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                                    {SYSTEM_FIELDS.map(f => (
                                                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-5 text-sm font-medium text-[#c084fc] pt-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {firstRowSample[idx]}
                                            {/* Mocking more lines for "Samples" look if needed, but single line is cleaner for table */}
                                            {/* <div className="text-blue-500 text-xs mt-1">Second sample...</div> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Options */}
                        <div className="p-8 pt-4 bg-[#0a0a0a]">
                            <div className="grid grid-cols-2 gap-12 mb-8 border-t border-[#1a1a1a] pt-8">
                                {/* Duplicates */}
                                <div className="space-y-4">
                                    <div className="text-sm font-bold text-white">Check for duplicates across all</div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-600 rounded-[4px] flex items-center justify-center p-0.5"><Check className="h-3 w-3 text-white" /></div>
                                            <span className="text-white text-sm font-medium">Campaigns</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-600 rounded-[4px] flex items-center justify-center p-0.5"><Check className="h-3 w-3 text-white" /></div>
                                            <span className="text-white text-sm font-medium">Lists</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-600 rounded-[4px] flex items-center justify-center p-0.5"><Check className="h-3 w-3 text-white" /></div>
                                            <span className="text-white text-sm font-medium">The Workspace</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Verify */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-[#333] rounded-[4px]"></div>
                                        <span className="text-gray-300 text-sm font-medium">Verify leads</span>
                                        <div className="bg-[#1a1a1a] border border-[#333] rounded-full px-2 py-0.5 flex items-center gap-1">
                                            <span className="text-yellow-500 text-[10px]">🪙</span>
                                            <span className="text-xs text-gray-400">0.25 / Row</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                    <div className="bg-green-500/10 rounded-full p-1"><Check className="h-3 w-3" /></div>
                                    Detected {parsedData.length || (file ? "many" : 0)} data rows
                                </div>
                                <Button
                                    onClick={handleUploadWithMapping}
                                    disabled={uploading}
                                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold tracking-wide px-12 py-6 rounded-lg shadow-lg shadow-green-900/20 w-48 text-sm"
                                >
                                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        <div className="flex flex-col items-center leading-none gap-1">
                                            <span>UPLOAD ALL</span>
                                            <Upload className="h-3 w-3 opacity-80" />
                                        </div>
                                    )}
                                </Button>

                            </div>
                        </div>
                    </div>
                )}

                {/* Keep Manual/Sheets UI (simplified for brevity in this replace, but functionality preserved above) */}
                {step === 'manual' && (
                    <div className="p-8 flex flex-col h-full flex-1">
                        <Button variant="ghost" onClick={() => setStep('source')} className="w-fit mb-4 text-gray-500 hover:text-white pl-0"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                        <h2 className="text-xl font-semibold text-white mb-6">Enter Emails</h2>
                        <Textarea
                            className="flex-1 bg-[#111] border-[#333] text-white resize-none"
                            placeholder="Enter emails..."
                            value={manualEmails}
                            onChange={e => setManualEmails(e.target.value)}
                        />
                        <Button className="mt-4 bg-blue-600" onClick={handleImportManual} disabled={uploading}>Import</Button>
                    </div>
                )}

                {step === 'sheets' && (
                    <div className="flex flex-col h-full flex-1 relative bg-[#0a0a0a]">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('csv_choice')}
                            className="absolute top-16 left-1/2 -translate-x-1/2 text-blue-500 hover:text-blue-400 font-medium hover:bg-transparent"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Choose another method
                        </Button>

                        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl mx-auto space-y-8">
                            {/* Google Sheets Logo */}
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8">
                                    <svg viewBox="0 0 87.3 132.6" className="w-full h-full">
                                        <path fill="#0F9D58" d="M42 0H8.3C3.7 0 0 3.8 0 8.3v116c0 4.6 3.7 8.3 8.3 8.3h66.3c4.6 0 8.3-3.8 8.3-8.3V41.3L42 0z" />
                                        <path fill="#ffffff" d="M62.6 42.4H42V15l20.6 27.4z" opacity=".5" />
                                        <path fill="#ffffff" d="M22.8 100h41.7v-7.6H22.8v7.6zm0-16.7h41.7v-7.6H22.8v7.6zm0-16.6h41.7v-7.6H22.8v7.6zm0-16.7h29.2v-7.6H22.8v7.6z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold text-white">Google Sheets</span>
                            </div>

                            <div className="bg-[#111] border border-[#222] rounded-lg px-4 py-3 flex items-center gap-3 w-full max-w-lg justify-center">
                                <span className="text-yellow-500">💡</span>
                                <span className="text-gray-300 text-sm font-medium">Make sure your Google Sheet is publicly accessible</span>
                            </div>

                            <div className="w-full max-w-lg space-y-6">
                                <div className="flex flex-col items-center gap-4 w-full mb-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-[#222] bg-[#111] text-white hover:bg-[#1a1a1a] flex items-center justify-center gap-2"
                                        onClick={handleGoogleDriveSelect}
                                        disabled={!pickerLoaded}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                        </svg>
                                        Browse Google Drive
                                    </Button>
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="h-px bg-[#222] flex-1"></div>
                                        <span className="text-gray-500 text-xs">OR PASTE LINK</span>
                                        <div className="h-px bg-[#222] flex-1"></div>
                                    </div>
                                </div>

                                <Input
                                    className="bg-[#111] border-[#222] text-gray-300 placeholder:text-gray-600 h-12 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-600"
                                    placeholder="Paste your Google Sheet link here"
                                    value={sheetsUrl}
                                    onChange={e => setSheetsUrl(e.target.value)}
                                />

                                <div className="flex justify-center">
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-lg font-medium shadow-[0_4px_20px_rgba(37,99,235,0.2)]"
                                        onClick={handleImportFromSheets}
                                        disabled={uploading || !sheetsUrl}
                                    >
                                        Import emails {uploading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ChevronLeft className="h-4 w-4 ml-2 rotate-180" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </DialogContent>
        </Dialog >
    )
}
