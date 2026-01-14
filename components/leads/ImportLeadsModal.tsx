"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Check, FileText, Search, Mail, Loader2, ChevronLeft, ArrowRight } from "lucide-react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"
import * as XLSX from "xlsx"

interface ImportLeadsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImportSuccess: () => void
}

type Step = 'source' | 'csv_choice' | 'csv' | 'sheets' | 'manual' | 'mapping'

const SYSTEM_FIELDS = [
    { value: "email", label: "Email", icon: "📧" },
    { value: "firstName", label: "First Name", icon: "👤" },
    { value: "lastName", label: "Last Name", icon: "👤" },
    { value: "jobTitle", label: "Job Title", icon: "💼" },
    { value: "company", label: "Company Name", icon: "🏢" },
    { value: "personalization", label: "Personalization", icon: "✨" },
    { value: "phone", label: "Phone", icon: "📱" },
    { value: "website", label: "Website", icon: "🌐" },
    { value: "location", label: "Location", icon: "📍" },
    { value: "linkedin", label: "LinkedIn", icon: "💼" },
    { value: "custom", label: "Custom Variable", icon: "⚙️" },
    { value: "skip", label: "Do not import", icon: "🚫" },
]

export function ImportLeadsModal({ open, onOpenChange, onImportSuccess }: ImportLeadsModalProps) {
    const params = useParams()
    const { toast } = useToast()
    const { data: session } = useSession()
    const [step, setStep] = useState<Step>('source')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sheetsUrl, setSheetsUrl] = useState('')
    const [manualEmails, setManualEmails] = useState('')

    // Mapping State
    const [csvHeaders, setCsvHeaders] = useState<string[]>([])
    const [sampleRows, setSampleRows] = useState<any[]>([]) // Store first 4 rows for samples
    const [parsedData, setParsedData] = useState<any[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

    const [duplicateCheck, setDuplicateCheck] = useState({
        campaigns: true,
        lists: true,
        workspace: true
    })

    // Upload progress for animated progress bar
    const [uploadProgress, setUploadProgress] = useState(0)

    // removed Google Picker


    // removed handleGoogleDriveSelect

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
        setError(null)
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

        if (isExcel) {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: 'binary' })
                    const sheetName = workbook.SheetNames[0]
                    const sheet = workbook.Sheets[sheetName]
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

                    if (json.length > 0) {
                        const headers = json[0].map(h => String(h || '').trim()).filter(h => h)

                        if (headers.length === 0) {
                            setError('No column headers found in the first row of the file.')
                            return
                        }

                        setCsvHeaders(headers)

                        if (json.length > 1) {
                            // Store first 4 rows for sample display
                            setSampleRows(json.slice(1, 5).map(row => {
                                const obj: any = {}
                                headers.forEach((h, i) => obj[h] = row[i])
                                return obj
                            }))
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
                    } else {
                        setError('The file appears to be empty.')
                    }
                } catch (err: any) {
                    console.error('Excel parsing error:', err)
                    setError('Failed to parse Excel file: ' + (err?.message || 'Unknown error'))
                }
            }
            reader.onerror = () => {
                setError('Failed to read the file. Please try again.')
            }
            reader.readAsBinaryString(file)
        } else {
            // CSV file - try reading with proper encoding
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const csvText = e.target?.result as string

                    if (!csvText || csvText.trim().length === 0) {
                        setError('The file appears to be empty.')
                        return
                    }

                    // Parse CSV using PapaParse
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: 'greedy', // More robust empty line skipping
                        transformHeader: (h) => h.trim(), // Trim headers
                        complete: (results) => {
                            console.log('PapaParse results:', results)

                            // Get headers from meta.fields (preferred) or from first data row
                            let headers = results.meta.fields || []

                            // Filter out empty headers
                            headers = headers.filter(h => h && h.trim().length > 0)

                            // If meta.fields failed, try extracting from first row of data
                            if (headers.length === 0 && results.data.length > 0) {
                                const firstRow = results.data[0] as any
                                headers = Object.keys(firstRow).filter(k => k && k.trim().length > 0)
                            }

                            if (headers.length === 0) {
                                console.error('No headers detected in CSV')
                                setError('Could not detect columns in this file. Please ensure your CSV has a header row with column names.')
                                return
                            }

                            console.log('Detected headers:', headers)
                            setCsvHeaders(headers)

                            // Less aggressive filtering: Keep row if it has ANY data matching a header
                            const validData = (results.data as any[]).filter(row => {
                                // Check if row has at least one valid value for our known headers
                                return headers.some(h => {
                                    const val = row[h]
                                    return val !== null && val !== undefined && String(val).trim().length > 0
                                })
                            })

                            // If filtering removed too many (more than 50% discrepancy), fallback to raw data length warning or use raw
                            // But usually invalid rows are just empty lines. 620 vs 850 is huge.
                            // Maybe the user has rows with different columns? 
                            // PapaParse handling of malformed CSVs might be the cause, but 'greedy' skip helps.

                            if (validData.length > 0) {
                                // Store first 4 rows for sample display
                                setSampleRows(validData.slice(0, 4))
                            } else {
                                // If validData is empty but results.data wasn't, something is wrong with filtering
                                if (results.data.length > 0) {
                                    console.warn("All rows filtered out as empty?", results.data.slice(0, 3))
                                    // Fallback to results.data if validData is empty (safeguard)
                                    setParsedData(results.data)
                                    setSampleRows(results.data.slice(0, 4))
                                    autoMap(headers)
                                    setStep('mapping')
                                    return
                                }
                            }

                            // Store all parsed data for upload
                            setParsedData(validData)
                            console.log('Parsed data count:', validData.length)

                            autoMap(headers)
                            setStep('mapping')
                        },
                        error: (err: Error) => {
                            console.error('PapaParse error:', err)
                            setError('Failed to parse CSV file: ' + err.message)
                        }
                    })
                } catch (err: any) {
                    console.error('CSV reading error:', err)
                    setError('Failed to read CSV file: ' + (err?.message || 'Unknown error'))
                }
            }
            reader.onerror = () => {
                setError('Failed to read the file. Please try again.')
            }
            // Read as text with UTF-8 encoding
            reader.readAsText(file, 'UTF-8')
        }
    }


    const autoMap = (headers: string[]) => {
        const initialMapping: Record<string, string> = {}
        headers.forEach(header => {
            const lower = header.toLowerCase().replace(/[^a-z]/g, '')
            if (lower.includes('email')) initialMapping[header] = 'email'
            else if (lower.includes('first')) initialMapping[header] = 'firstName'
            else if (lower.includes('last') || lower.includes('surname')) initialMapping[header] = 'lastName'
            else if (lower.includes('job') || lower.includes('title') || lower.includes('position') || lower.includes('role')) initialMapping[header] = 'jobTitle'
            else if (lower.includes('company') || lower.includes('organization') || lower.includes('org')) initialMapping[header] = 'company'
            else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell') || lower.includes('tel')) initialMapping[header] = 'phone'
            else if (lower.includes('website') || lower.includes('url') || lower.includes('domain')) initialMapping[header] = 'website'
            else if (lower.includes('location') || lower.includes('city') || lower.includes('country') || lower.includes('address') || lower.includes('state')) initialMapping[header] = 'location'
            else if (lower.includes('linkedin')) initialMapping[header] = 'linkedin'
            else if (lower.includes('personalization') || lower.includes('icebreaker') || lower.includes('intro')) initialMapping[header] = 'personalization'
            else initialMapping[header] = 'custom' // Default to custom for better data retention
        })
        setColumnMapping(initialMapping)
    }

    const handleUploadWithMapping = async () => {
        if (!params.id) return

        setUploading(true)
        setError(null)
        setUploadProgress(0)

        const dataToProcess = parsedData.length > 0 ? parsedData : []

        // If no parsed data but we have a file, parse it first
        if (dataToProcess.length === 0 && file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    await processAndUploadBatched(results.data as any[])
                }
            })
            return
        }

        await processAndUploadBatched(dataToProcess)

        async function processAndUploadBatched(rawData: any[]) {
            try {
                // Map all leads first
                const mappedLeads = rawData.map((row: any) => {
                    const lead: any = { email: '', firstName: '', lastName: '', company: '', customFields: {} }
                    Object.keys(row).forEach((header) => {
                        const targetField = columnMapping[header]
                        const value = row[header]

                        if (targetField === 'email') lead.email = value
                        else if (targetField === 'firstName') lead.firstName = value
                        else if (targetField === 'lastName') lead.lastName = value
                        else if (targetField === 'company') lead.company = value
                        else if (targetField !== 'skip' && value) {
                            lead.customFields[targetField] = value
                            if (header !== targetField) {
                                lead.customFields[header] = value
                            }
                        }
                    })

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

                const BATCH_SIZE = 200
                const totalLeads = mappedLeads.length
                let processed = 0

                // Upload in batches for large datasets with progress tracking
                for (let i = 0; i < mappedLeads.length; i += BATCH_SIZE) {
                    const batch = mappedLeads.slice(i, i + BATCH_SIZE)

                    const res = await fetch(`/api/campaigns/${params.id}/leads/import`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'json',
                            leads: batch
                        }),
                    })

                    if (!res.ok) {
                        const data = await res.json()
                        throw new Error(data.error || "Upload failed")
                    }

                    processed += batch.length
                    const progress = Math.round((processed / totalLeads) * 100)
                    setUploadProgress(progress)
                }

                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${totalLeads} leads.`
                })

                onImportSuccess()
                resetAndClose()
            } catch (err: any) {
                setError(err.message)
                toast({
                    title: "Import Failed",
                    description: err.message,
                    variant: "destructive"
                })
            } finally {
                setUploading(false)
                setUploadProgress(0)
            }
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

            const firstRow = data[0]
            // Store first 4 rows for sample display
            setSampleRows(data.slice(0, 4))

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
        setError(null)
        try {
            // Parse emails (don't use regex in main thread for huge strings)
            const emailLines = manualEmails.split(/[\n,]/)
            const emails: string[] = []
            for (const line of emailLines) {
                const trimmed = line.trim()
                if (trimmed.includes('@')) {
                    emails.push(trimmed)
                }
            }

            if (emails.length === 0) {
                throw new Error("No valid emails found. Please enter emails separated by commas or new lines.")
            }

            // For large datasets, use batching
            const BATCH_SIZE = 100
            let totalImported = 0

            if (emails.length > BATCH_SIZE) {
                // Process in batches for large datasets
                for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                    const batch = emails.slice(i, i + BATCH_SIZE)

                    const res = await fetch(`/api/campaigns/${params.id}/leads/import`, {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'manual', emails: batch }),
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || "Import failed")

                    totalImported += data.count || batch.length
                }

                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${totalImported} leads in batches.`
                })
            } else {
                // Small dataset - single request
                const res = await fetch(`/api/campaigns/${params.id}/leads/import`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'manual', emails }),
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Import failed")

                toast({
                    title: "Import Successful",
                    description: data.message || `Successfully imported ${data.count} leads.`
                })
            }

            onImportSuccess(); resetAndClose()
        } catch (err: any) {
            setError(err.message)
            toast({
                title: "Import Failed",
                description: err.message,
                variant: "destructive"
            })
        } finally { setUploading(false) }
    }


    const resetAndClose = () => {
        setStep('source')
        setFile(null)
        setError(null)
        setSheetsUrl('')
        setManualEmails('')
        setCsvHeaders([])
        setSampleRows([])
        setParsedData([])
        setColumnMapping({})
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
                                onClick={() => setStep('csv')}
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

                {/* CSV Choice Removed */}

                {/* CSV Upload */}
                {step === 'csv' && (
                    <div className="p-8 flex flex-col h-full flex-1 justify-center items-center">
                        <Button variant="ghost" onClick={() => setStep('source')} className="absolute top-6 left-6 text-gray-500 hover:text-white pl-0 hover:bg-transparent">
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
                                {/* Fallback: if csvHeaders is empty but we have parsedData, extract headers from it */}
                                {csvHeaders.length === 0 && parsedData.length > 0 && (() => {
                                    // Try to extract headers from first parsed row
                                    const firstRow = parsedData[0] || {}
                                    const extractedHeaders = Object.keys(firstRow).filter(k => k && k.trim().length > 0)
                                    if (extractedHeaders.length > 0) {
                                        // Side effect: update csvHeaders state
                                        // Use setTimeout to avoid render-cycle error
                                        setTimeout(() => {
                                            setCsvHeaders(extractedHeaders)
                                            // Only run automap if we haven't already mapped
                                            if (Object.keys(columnMapping).length === 0) {
                                                autoMap(extractedHeaders)
                                            }
                                        }, 0)
                                    }
                                    return null
                                })()}


                                {csvHeaders.length === 0 && parsedData.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="text-yellow-500 mb-2">⚠️ No columns detected</div>
                                        <p className="text-sm mb-4">Could not detect columns from your file. Please ensure your CSV has a header row.</p>
                                        <Button variant="outline" onClick={() => { setStep('csv'); setFile(null) }} className="border-[#333] text-white">
                                            Try Different File
                                        </Button>
                                    </div>
                                )}

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
                                                        <SelectItem key={f.value} value={f.value}>
                                                            <span className="flex items-center gap-2">
                                                                <span>{f.icon}</span>
                                                                <span>{f.label}</span>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-5 pt-2.5 space-y-1">
                                            {/* Show up to 4 sample values per column */}
                                            {sampleRows.slice(0, 4).map((row, rowIdx) => {
                                                const value = String(row[header] ?? '')
                                                return value ? (
                                                    <div
                                                        key={rowIdx}
                                                        className={`text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap ${rowIdx % 2 === 0 ? 'text-white' : 'text-[#c084fc]'}`}
                                                    >
                                                        {value}
                                                    </div>
                                                ) : null
                                            })}
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
                                            <Checkbox
                                                checked={duplicateCheck.campaigns}
                                                onCheckedChange={(c) => setDuplicateCheck(p => ({ ...p, campaigns: !!c }))}
                                                className="border-[#333] data-[state=checked]:bg-blue-600"
                                            />
                                            <span className="text-white text-sm font-medium">Campaigns</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={duplicateCheck.lists}
                                                onCheckedChange={(c) => setDuplicateCheck(p => ({ ...p, lists: !!c }))}
                                                className="border-[#333] data-[state=checked]:bg-blue-600"
                                            />
                                            <span className="text-white text-sm font-medium">Lists</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={duplicateCheck.workspace}
                                                onCheckedChange={(c) => setDuplicateCheck(p => ({ ...p, workspace: !!c }))}
                                                className="border-[#333] data-[state=checked]:bg-blue-600"
                                            />
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
                                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold tracking-wide rounded-lg shadow-lg shadow-green-900/20 w-64 h-14 text-sm relative overflow-hidden flex flex-col justify-center gap-1"
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center w-full">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                <span className="text-xs">UPLOADING {uploadProgress > 0 ? `${uploadProgress}%` : ''}</span>
                                            </div>
                                            <div className="w-40 h-1 bg-green-900/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress || 10}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center leading-none">
                                            <span className="text-[13px]">UPLOAD ALL</span>
                                            <Upload className="h-3.5 w-3.5 mt-1 opacity-70" />
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
                            onChange={e => {
                                setManualEmails(e.target.value)
                                if (error) setError(null)
                            }}
                        />
                        {error && (
                            <div className="text-red-400 text-sm mt-2 flex items-center gap-2">
                                <span className="bg-red-400/10 p-1 rounded-full"><X className="h-3 w-3" /></span>
                                {error}
                            </div>
                        )}
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleImportManual} disabled={uploading || !manualEmails.trim()}>
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Import Emails
                        </Button>
                    </div>
                )}

                {step === 'sheets' && (
                    <div className="flex flex-col h-full flex-1 relative bg-[#0a0a0a]">
                        <Button
                            variant="ghost"
                            onClick={() => setStep('source')}
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
                                    {/* Removed Google Picker Button */}
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
