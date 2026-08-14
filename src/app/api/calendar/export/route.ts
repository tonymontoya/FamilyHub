/**
 * Calendar Export API
 * 
 * Exports calendar events in iCalendar (.ics) format
 * Compatible with Google Calendar, Apple Calendar, Outlook
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

/**
 * Generate iCalendar content from events
 */
function generateICS(events: Array<{
  id: string
  title: string
  description: string | null
  startDate: Date
  startTime: Date | null
  endDate: Date | null
  endTime: Date | null
  location: string | null
  isRecurring: boolean
  recurrenceRule: string | null
  updatedAt: Date
}>): string {
  const now = new Date()
  const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'")
  
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Hub//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Family Hub Calendar",
    "X-WR-TIMEZONE:UTC",
  ]
  
  for (const event of events) {
    const start = formatEventDate(event.startDate, event.startTime)
    const end = event.endDate 
      ? formatEventDate(event.endDate, event.endTime)
      : formatEventDate(event.startDate, event.startTime, true) // Same day, add 1 hour if no end
    
    const lastModified = format(event.updatedAt, "yyyyMMdd'T'HHmmss'Z'")
    
    ics.push("BEGIN:VEVENT")
    ics.push(`UID:${event.id}@familyhub.local`)
    ics.push(`DTSTAMP:${timestamp}`)
    ics.push(`DTSTART${start}`)
    ics.push(`DTEND${end}`)
    ics.push(`SUMMARY:${escapeICS(event.title)}`)
    
    if (event.description) {
      ics.push(`DESCRIPTION:${escapeICS(event.description)}`)
    }
    
    if (event.location) {
      ics.push(`LOCATION:${escapeICS(event.location)}`)
    }
    
    if (event.isRecurring && event.recurrenceRule) {
      // Convert from RRULE format to iCalendar RRULE
      ics.push(`RRULE:${event.recurrenceRule}`)
    }
    
    ics.push(`LAST-MODIFIED:${lastModified}`)
    ics.push("END:VEVENT")
  }
  
  ics.push("END:VCALENDAR")
  
  return ics.join("\r\n")
}

/**
 * Format event date for iCalendar
 */
function formatEventDate(date: Date, time: Date | null, addHour: boolean = false): string {
  if (time) {
    // Timed event
    const dt = new Date(date)
    dt.setHours(time.getHours(), time.getMinutes(), 0, 0)
    if (addHour) {
      dt.setHours(dt.getHours() + 1)
    }
    return ":" + format(dt, "yyyyMMdd'T'HHmmss")
  } else {
    // All-day event
    const dt = new Date(date)
    if (addHour) {
      dt.setDate(dt.getDate() + 1)
    }
    return ";VALUE=DATE:" + format(dt, "yyyyMMdd")
  }
}

/**
 * Escape special characters for iCalendar
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
}

/**
 * GET /api/calendar/export
 * 
 * Export calendar events as iCalendar (.ics) format
 * Query params:
 * - start: Start date (YYYY-MM-DD)
 * - end: End date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get user's family
    const member = await prisma.member.findUnique({
      where: { userId: session.user.id },
      select: { familyId: true },
    })
    
    if (!member) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")
    
    // Default to current month if no dates provided
    const startDate = startParam 
      ? new Date(startParam) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    
    const endDate = endParam 
      ? new Date(endParam) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0) // 3 months default
    
    // Fetch events
    const events = await prisma.calendarEvent.findMany({
      where: {
        familyId: member.familyId,
        deletedAt: null,
        OR: [
          // Events within date range
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Recurring events that might overlap
          {
            isRecurring: true,
            OR: [
              { recurrenceEnd: null },
              { recurrenceEnd: { gte: startDate } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
    })
    
    // Generate ICS content
    const icsContent = generateICS(events)
    
    // Return as downloadable file
    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="family-hub-calendar-${format(new Date(), "yyyy-MM-dd")}.ics"`,
      },
    })
  } catch (error) {
    console.error("Calendar export error:", error)
    return NextResponse.json(
      { error: "Failed to export calendar" },
      { status: 500 }
    )
  }
}
