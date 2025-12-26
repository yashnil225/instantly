"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, CloudUpload, Coins, Mail, User, Phone, Globe, Briefcase, Building2, UserCircle, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CsvUploadPage() {
    const [step, setStep] = useState(2) // 1: Upload, 2: Mapping
    const [mappings, setMappings] = useState<Record<string, string>>({
        "firstName": "First Name",
        "fullName": "Do not import",
        "email": "Email",
        "country": "Do not import",
        "city": "Do not import"
    })

    const columns = [
        { name: "firstName", samples: ["Valerie", "Donna", "Anthony", "Paola"] },
        { name: "fullName", samples: ["Valerie Pratto", "Donna Feestham", "Anthony Castaneda", "Paola Chaaya"] },
        { name: "email", samples: ["valerie.pratto@tc.tc", "donna@sametz.com", "acastaneda@rocketfuel.com", "paola.chaaya@userfarm.com"] },
        { name: "country", samples: ["Canada", "United States", "United States", "Italy"] },
        { name: "city", samples: ["Rouyn-Noranda", "Boston", "San Francisco", "Milan"] },
    ]

    const fieldTypes = [
        { name: "Do not import", icon: CloudUpload, color: "text-gray-400" },
        { name: "Email", icon: Mail, color: "text-blue-400" },
        { name: "First Name", icon: User, color: "text-yellow-400" },
        { name: "Last Name", icon: User, color: "text-yellow-400" },
        { name: "Job Title", icon: Briefcase, color: "text-yellow-400" },
        { name: "Company Name", icon: Building2, color: "text-yellow-400" },
        { name: "Personalization", icon: UserCircle, color: "text-green-400" },
        { name: "Phone", icon: Phone, color: "text-gray-400" },
        { name: "Website", icon: Globe, color: "text-gray-400" },
    ]

    const getFieldType = (name: string) => fieldTypes.find(f => f.name === name) || fieldTypes[0];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 text-blue-500 hover:text-blue-400 hover:bg-transparent pl-0 gap-2"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Choose another method
                </Button>

                <h1 className="text-xl font-semibold mb-6">Upload CSV File</h1>

                {/* File Info */}
                <div className="border border-dashed border-[#2a2a2a] rounded-lg p-6 mb-8 relative">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-sm text-gray-500 mb-1">135 KB</div>
                        <div className="text-lg font-medium mb-4">50k leads of Marketing and Advertising (For instantly campaign - 0-2k.csv</div>
                        <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <CheckIcon className="h-4 w-4" />
                            File processed
                        </div>
                    </div>
                    <button className="absolute top-4 right-4 text-blue-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Mapping Table */}
                <div className="space-y-6">
                    <div className="grid grid-cols-[200px_1fr_1fr] gap-8 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div>Column Name</div>
                        <div>Select Type</div>
                        <div>Samples</div>
                    </div>

                    <div className="space-y-0">
                        {columns.map((column, index) => (
                            <div key={column.name} className={`grid grid-cols-[200px_1fr_1fr] gap-8 py-6 items-start ${index !== 0 ? 'border-t border-[#2a2a2a]' : ''}`}>
                                <div className="text-gray-300 font-medium pt-2">{column.name}</div>

                                <div>
                                    <Select
                                        value={mappings[column.name]}
                                        onValueChange={(val) => setMappings({ ...mappings, [column.name]: val })}
                                    >
                                        <SelectTrigger className="w-full bg-[#111] border-[#2a2a2a] text-white">
                                            <div className="flex items-center gap-2">
                                                {getFieldType(mappings[column.name]) && (
                                                    (() => {
                                                        const Icon = getFieldType(mappings[column.name])!.icon;
                                                        return <Icon className={cn("h-4 w-4", getFieldType(mappings[column.name])!.color)} />
                                                    })()
                                                )}
                                                <SelectValue>{mappings[column.name]}</SelectValue>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white w-[300px]">
                                            {fieldTypes.map(type => (
                                                <SelectItem key={type.name} value={type.name} className="focus:bg-[#2a2a2a] focus:text-white cursor-pointer py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className={cn("h-4 w-4", type.color)} />
                                                        {type.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    {column.samples.map((sample, i) => (
                                        <div key={i} className={`text-sm ${column.name === 'email' ? 'text-blue-400' :
                                                column.name === 'city' ? 'text-purple-400' :
                                                    'text-gray-300'
                                            }`}>
                                            {sample}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Options */}
                <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-8">
                        <span className="text-sm font-medium text-gray-300">Check for duplicates across all</span>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <Checkbox className="border-gray-600 bg-[#1a1a1a] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm" defaultChecked />
                                Campaigns
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <Checkbox className="border-gray-600 bg-[#1a1a1a] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm" defaultChecked />
                                Lists
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <Checkbox className="border-gray-600 bg-[#1a1a1a] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm" defaultChecked />
                                The Workspace
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox id="verify" className="border-gray-600 bg-[#1a1a1a] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-sm" />
                        <label htmlFor="verify" className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            Verify leads
                            <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded textxs">
                                <Coins className="h-3 w-3 fill-yellow-500" />
                                0.25 / Row
                            </span>
                        </label>
                    </div>

                    <div className="flex flex-col items-center justify-center pt-8 gap-4">
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                            <div className="border-2 border-green-500 rounded-full p-0.5">
                                <CheckIcon className="h-3 w-3" strokeWidth={3} />
                            </div>
                            Detected 1,999 data rows
                        </div>
                        <Button className="bg-[#2a9d6e] hover:bg-[#238b5f] text-white font-bold px-12 py-6 rounded text-sm shadow-[0_4px_14px_0_rgba(42,157,110,0.39)] transition-all hover:scale-105">
                            <div className="flex flex-col items-center">
                                UPLOAD ALL
                                <CloudUpload className="h-4 w-4 mt-1" />
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="fixed bottom-6 right-6">
                <Button size="icon" className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-500 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </Button>
            </div>
        </div>
    )
}

function CheckIcon({ className, ...props }: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
