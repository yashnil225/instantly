"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload, FileSpreadsheet, Search, Mail, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_CSV_COLUMNS = ["firstName", "lastName", "email", "company", "city", "country"]
const MOCK_SAMPLES = {
    firstName: ["Valerie", "Donna", "Anthony"],
    lastName: ["Pratte", "Feetham", "Castaneda"],
    email: ["valerie.pratte@tc.tc", "donna@sametz.com", "acastaneda@rocketfuel.com"],
    company: ["TC Transcontinental", "Sametz Blackstone", "Rocket Fuel Inc."],
    city: ["Rouyn-Noranda", "Boston", "San Francisco"],
    country: ["Canada", "United States", "United States"]
}

const FIELD_OPTIONS = [
    { value: "email", label: "Email", icon: Mail },
    { value: "firstName", label: "First Name" },
    { value: "lastName", label: "Last Name" },
    { value: "companyName", label: "Company Name" },
    { value: "jobTitle", label: "Job Title" },
    { value: "website", label: "Website" },
    { value: "phone", label: "Phone" },
    { value: "location", label: "Location" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "custom", label: "Custom Variable" },
    { value: "skip", label: "Do not import", icon: X },
]

export default function ImportLeadsPage({ params }: { params: { id: string } }) {
    const [step, setStep] = useState<"select" | "upload" | "mapping" | "google-sheets">("select")
    const [file, setFile] = useState<File | null>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setStep("mapping")
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/campaigns/${params.id}/leads`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">
                    {step === "select" && "Add Leads"}
                    {step === "upload" && "Upload CSV"}
                    {step === "mapping" && "Map Fields"}
                    {step === "google-sheets" && "Import from Google Sheets"}
                </h1>
            </div>

            {step === "select" && (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card
                        className="p-8 cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-center group"
                        onClick={() => setStep("upload")}
                    >
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Upload CSV</h3>
                            <p className="text-sm text-muted-foreground">Import leads from a CSV file</p>
                        </div>
                    </Card>

                    <Card className="p-8 cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-center group">
                        <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Search className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Supersearch</h3>
                            <p className="text-sm text-muted-foreground">Find leads from our database</p>
                        </div>
                    </Card>

                    <Card className="p-8 cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-center group">
                        <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                            <Mail className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Enter Emails Manually</h3>
                            <p className="text-sm text-muted-foreground">Copy and paste email addresses</p>
                        </div>
                    </Card>

                    <Card
                        className="p-8 cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center gap-4 text-center group"
                        onClick={() => setStep("google-sheets")}
                    >
                        <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Google Sheets</h3>
                            <p className="text-sm text-muted-foreground">Import directly from Google Sheets</p>
                        </div>
                    </Card>
                </div>
            )}

            {step === "upload" && (
                <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Upload CSV File</h3>
                        <p className="text-sm text-muted-foreground mb-4">Drag and drop your file here or click to browse</p>
                        <Input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            id="csv-upload"
                            onChange={handleFileUpload}
                        />
                        <Button asChild>
                            <label htmlFor="csv-upload" className="cursor-pointer">
                                Select File
                            </label>
                        </Button>
                    </div>
                </Card>
            )}

            {step === "google-sheets" && (
                <Card className="p-8 space-y-6 max-w-2xl mx-auto">
                    <div className="space-y-2 text-center">
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500 mb-4">
                            <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">Google Sheets</h3>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <span className="text-yellow-500">💡</span> Make sure your Google Sheet is publicly accessible
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input placeholder="Paste your Google Sheet link here" />
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Import emails</Button>
                    </div>
                </Card>
            )}

            {step === "mapping" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-green-500/10 text-green-500 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            <span className="font-medium">File processed</span>
                        </div>
                        <span className="text-sm opacity-80">135 KB • 50k leads detected</span>
                    </div>

                    <div className="rounded-lg border bg-card">
                        <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 p-4 border-b font-medium text-sm text-muted-foreground">
                            <div>Column Name</div>
                            <div>Select Type</div>
                            <div>Samples</div>
                        </div>

                        {MOCK_CSV_COLUMNS.map((col) => (
                            <div key={col} className="grid grid-cols-[1fr_1fr_2fr] gap-4 p-4 border-b last:border-0 items-center">
                                <div className="font-medium">{col}</div>
                                <div>
                                    <Select defaultValue={col === "email" ? "email" : "skip"}>
                                        <SelectTrigger className={cn(
                                            "w-full",
                                            col === "email" && "border-blue-500/50 bg-blue-500/10 text-blue-500"
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FIELD_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex items-center gap-2">
                                                        {opt.icon && <opt.icon className="h-4 w-4" />}
                                                        {opt.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    {MOCK_SAMPLES[col as keyof typeof MOCK_SAMPLES]?.map((sample, i) => (
                                        <div key={i} className="truncate">{sample}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Checkbox id="check-dupes" />
                                <label htmlFor="check-dupes" className="text-sm font-medium">Check for duplicates across all</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="verify" />
                                <label htmlFor="verify" className="text-sm font-medium">Verify leads</label>
                            </div>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 min-w-[150px]">
                            UPLOAD ALL
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
