import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportButtonProps {
    data: any[]
    filename: string
    type?: "campaigns" | "leads"
}

export function ExportButton({ data, filename, type = "campaigns" }: ExportButtonProps) {
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert("No data to export")
            return
        }

        let headers: string[]
        let rows: string[][]

        if (type === "campaigns") {
            headers = ["Name", "Status", "Leads", "Sent", "Opened", "Replied", "Created"]
            rows = data.map(campaign => [
                campaign.name || "",
                campaign.status || "",
                campaign._count?.leads?.toString() || "0",
                campaign.sentCount?.toString() || "0",
                campaign.openCount?.toString() || "0",
                campaign.replyCount?.toString() || "0",
                new Date(campaign.createdAt).toLocaleDateString()
            ])
        } else {
            // leads
            headers = ["Email", "First Name", "Last Name", "Company", "Status", "Created"]
            rows = data.map(lead => [
                lead.email || "",
                lead.firstName || "",
                lead.lastName || "",
                lead.company || "",
                lead.status || "",
                new Date(lead.createdAt).toLocaleDateString()
            ])
        }

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)

        link.setAttribute("href", url)
        link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = "hidden"

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="border-[#333] text-gray-300 hover:bg-[#1a1a1a] gap-2"
        >
            <Download className="h-4 w-4" />
            Export CSV
        </Button>
    )
}
