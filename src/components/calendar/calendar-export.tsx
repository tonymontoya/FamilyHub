"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { toast } from "sonner"

interface CalendarExportProps {
  currentDate: Date
}

export function CalendarExport({ currentDate }: CalendarExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (months: number) => {
    setIsExporting(true)
    
    try {
      // Calculate date range
      const start = startOfMonth(currentDate)
      const end = endOfMonth(addMonths(currentDate, months - 1))
      
      const startParam = format(start, "yyyy-MM-dd")
      const endParam = format(end, "yyyy-MM-dd")
      
      // Fetch export
      const response = await fetch(
        `/api/calendar/export?start=${startParam}&end=${endParam}`
      )
      
      if (!response.ok) {
        throw new Error("Export failed")
      }
      
      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `family-hub-calendar-${format(new Date(), "yyyy-MM-dd")}.ics`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Calendar exported", {
        description: `Exported ${months} month${months > 1 ? "s" : ""} of events`,
      })
    } catch (error) {
      toast.error("Export failed", {
        description: "Could not export calendar. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport(1)}>
          Export This Month
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(3)}>
          Export 3 Months
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(12)}>
          Export 1 Year
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
