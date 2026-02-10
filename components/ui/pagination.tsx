import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    itemsPerPage?: number
    onItemsPerPageChange?: (items: number) => void
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage = 20,
    onItemsPerPageChange
}: PaginationProps) {
    const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        if (totalPages <= 5) return i + 1
        if (currentPage <= 3) return i + 1
        if (currentPage >= totalPages - 2) return totalPages - 4 + i
        return currentPage - 2 + i
    })

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {onItemsPerPageChange && (
                    <>
                        <span>Show</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(v) => onItemsPerPageChange(parseInt(v))}>
                            <SelectTrigger className="w-20 h-8 bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-border text-foreground hover:bg-secondary disabled:opacity-30"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pages.map((page) => (
                    <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={
                            page === currentPage
                                ? "bg-primary hover:bg-primary/90"
                                : "border-border text-foreground hover:bg-secondary"
                        }
                    >
                        {page}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-border text-foreground hover:bg-secondary disabled:opacity-30"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    )
}
