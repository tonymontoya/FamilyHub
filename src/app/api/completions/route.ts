import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import formidable from "formidable"
import { promises as fs } from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"
import {
  authenticate,
  requireAuth,
  checkRateLimit,
  isValidUUID,
  Errors,
} from "@/lib/api-utils"
import {
  validateFileMetadata,
  saveFile,
  deleteFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "@/lib/file-upload"

// Rate limiting: Max 20 completions per hour per member
const RATE_LIMIT_CONFIG = { max: 20, windowMs: 60 * 60 * 1000 }

// Formidable configuration
const formConfig: formidable.Options = {
  maxFileSize: MAX_FILE_SIZE,
  maxFiles: 1,
  filter: (part) => {
    // Only accept image uploads
    return part.mimetype 
      ? (ALLOWED_MIME_TYPES as readonly string[]).includes(part.mimetype) 
      : false
  },
}

// Input validation schema for fields
const completionSchema = z.object({
  choreId: z.string().refine(isValidUUID, {
    message: "Invalid chore ID format",
  }),
  completedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

/**
 * Parse multipart form data using formidable
 * Works with Next.js App Router by creating a fake IncomingMessage
 */
async function parseFormData(
  request: NextRequest
): Promise<{
  fields: formidable.Fields
  files: formidable.Files
}> {
  return new Promise(async (resolve, reject) => {
    const form = formidable(formConfig)

    // Convert Web Request to Node.js readable stream
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a fake IncomingMessage
    const stream = require("stream")
    const fakeReq = new stream.PassThrough()
    fakeReq.end(buffer)

    // Copy headers from original request
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    fakeReq.headers = headers
    fakeReq.headers["content-length"] = buffer.length.toString()

    form.parse(fakeReq as any, (err, fields, files) => {
      if (err) {
        reject(err)
      } else {
        resolve({ fields, files })
      }
    })
  })
}

/**
 * POST /api/completions
 *
 * Mark a chore as complete with optional photo and notes.
 * Idempotent: Same chore + child + day updates existing completion.
 */
export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null
  let tempFilePath: string | null = null

  try {
    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    const member = authContext!.member

    // Check rate limit
    if (!checkRateLimit(`completion:${member.id}`, RATE_LIMIT_CONFIG)) {
      return Errors.tooManyRequests()
    }

    // Parse multipart form data
    let fields: formidable.Fields
    let files: formidable.Files
    try {
      const parsed = await parseFormData(request)
      fields = parsed.fields
      files = parsed.files
    } catch (parseError) {
      console.error("Form parsing error:", parseError)
      return Errors.badRequest("Invalid form data")
    }

    // Extract and validate fields
    const choreId = fields.choreId?.[0]
    const completedAtStr = fields.completedAt?.[0]
    const notes = fields.notes?.[0]

    const validationResult = completionSchema.safeParse({
      choreId,
      completedAt: completedAtStr,
      notes,
    })

    if (!validationResult.success) {
      return Errors.badRequest(
        "Invalid input",
        validationResult.error.flatten()
      )
    }

    const { choreId: validatedChoreId, notes: validatedNotes } =
      validationResult.data

    // Validate completedAt date
    const completedAt = completedAtStr ? new Date(completedAtStr) : new Date()
    if (isNaN(completedAt.getTime())) {
      return Errors.badRequest("Invalid date")
    }

    // Prevent future dates
    if (completedAt > new Date()) {
      return Errors.badRequest("Date cannot be in the future")
    }

    // Get the chore and verify it exists and belongs to family
    const chore = await prisma.chore.findUnique({
      where: { id: validatedChoreId },
      include: { assignee: true },
    })

    if (!chore) {
      return Errors.notFound("Chore")
    }

    if (chore.familyId !== member.familyId) {
      return Errors.forbidden("Access denied")
    }

    // Check if chore is active
    if (chore.status !== "ACTIVE" || chore.deletedAt) {
      return Errors.badRequest("Cannot complete archived or deleted chore")
    }

    // Authorization check:
    // - PARENT can complete any chore in their family
    // - CHILD can only complete chores assigned to them (or unassigned chores)
    if (member.role === "CHILD") {
      if (chore.assigneeId && chore.assigneeId !== member.id) {
        return Errors.forbidden("Not assigned to this chore")
      }
      // Note: Unassigned chores (assigneeId is null) can be completed by any child
      // This is intentional - allows "first come first served" for unassigned chores
    }

    // Handle file upload if present
    let photoUrl: string | null = null
    const file = files.photo?.[0]

    if (file) {
      tempFilePath = file.filepath
      
      // Validate file metadata
      const metadataValidation = validateFileMetadata({
        mimetype: file.mimetype || undefined,
        size: file.size,
        originalFilename: file.originalFilename,
      })

      if (!metadataValidation.valid) {
        return Errors.badRequest("Invalid file")
      }

      // Save file with validation
      try {
        const uploadResult = await saveFile(
          file.filepath,
          file.originalFilename,
          { prefix: "completion", validateContent: true }
        )
        photoUrl = uploadResult.publicUrl
        uploadedFilePath = uploadResult.filepath
      } catch (saveError) {
        console.error("File save error:", saveError)
        return Errors.badRequest("Failed to save file")
      }
    }

    // Calculate scheduledFor date (for idempotency - date only, no time)
    const scheduledFor = new Date(
      completedAt.getFullYear(),
      completedAt.getMonth(),
      completedAt.getDate()
    )

    // Sanitize notes
    const sanitizedNotes = validatedNotes
      ? validatedNotes.replace(/<[^>]*>/g, "").trim().slice(0, 500)
      : null

    // Use upsert with unique constraint for atomic create/update
    // This prevents race conditions
    let completion: any
    let isUpdate = false
    
    try {
      completion = await prisma.completion.upsert({
        where: {
          unique_completion_per_day: {
            choreId: validatedChoreId,
            memberId: member.id,
            scheduledFor: scheduledFor,
          },
        },
        update: {
          photoUrl: photoUrl || undefined,
          notes: sanitizedNotes || undefined,
          completedAt: completedAt,
          status: "PENDING",
        },
        create: {
          choreId: validatedChoreId,
          memberId: member.id,
          completedAt: completedAt,
          scheduledFor: scheduledFor,
          photoUrl: photoUrl,
          notes: sanitizedNotes,
          status: "PENDING",
        },
        include: {
          chore: {
            select: { title: true, points: true },
          },
          member: {
            select: { displayName: true },
          },
        },
      })
      
      // Check if this was an update by comparing createdAt and updatedAt
      isUpdate = completion.updatedAt.getTime() !== completion.createdAt.getTime()
      
      // If we uploaded a new photo and it's an update, delete the old one
      if (isUpdate && photoUrl) {
        const oldCompletion = await prisma.completion.findUnique({
          where: { id: completion.id },
          select: { photoUrl: true }
        })
        
        if (oldCompletion?.photoUrl && oldCompletion.photoUrl !== photoUrl) {
          const oldPath = path.join(process.cwd(), "public", oldCompletion.photoUrl)
          try {
            await deleteFile(oldPath)
          } catch (deleteError) {
            console.error("Failed to delete old photo:", deleteError)
            // Continue - old file will be cleaned up by periodic job
          }
        }
      }
    } catch (upsertError) {
      // Clean up uploaded file on error
      if (uploadedFilePath) {
        try {
          await deleteFile(uploadedFilePath)
        } catch {}
      }
      throw upsertError
    }

    return NextResponse.json(
      {
        id: completion.id,
        choreId: completion.choreId,
        memberId: completion.memberId,
        completedAt: completion.completedAt.toISOString(),
        scheduledFor: completion.scheduledFor?.toISOString() || null,
        photoUrl: completion.photoUrl,
        notes: completion.notes,
        status: completion.status,
        points: completion.chore.points,
        choreTitle: completion.chore.title,
        memberName: completion.member.displayName,
        updated: isUpdate,
      },
      { status: isUpdate ? 200 : 201 }
    )
  } catch (error) {
    console.error("Completion creation error:", error)

    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        await deleteFile(uploadedFilePath)
      } catch {}
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Errors.conflict("Completion already exists")
    }

    return Errors.internal()
  } finally {
    // Clean up temp file if it wasn't moved
    if (tempFilePath && !uploadedFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch {}
    }
  }
}

/**
 * GET /api/completions
 *
 * Get completions for the authenticated member.
 * Parents can see all family completions.
 * Children can only see their own.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authContext = await authenticate()
    const authError = requireAuth(authContext)
    if (authError) return authError

    const member = authContext!.member

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "PENDING" | "APPROVED" | "DECLINED" | null
    const childId = searchParams.get("childId")

    // Build where clause
    const where: Prisma.CompletionWhereInput = {}

    if (member.role === "PARENT") {
      // Parent can see all completions in family
      where.chore = { familyId: member.familyId }

      // Filter by specific child if requested
      if (childId) {
        if (!isValidUUID(childId)) {
          return Errors.badRequest("Invalid child ID")
        }
        
        // Verify the child belongs to the parent's family
        const childMember = await prisma.member.findFirst({
          where: {
            id: childId,
            familyId: member.familyId,
            role: "CHILD",
            deletedAt: null,
          },
        })
        
        if (!childMember) {
          return Errors.forbidden("Invalid child ID")
        }
        
        where.memberId = childId
      }
    } else {
      // Child can only see their own
      where.memberId = member.id
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Get completions
    const completions = await prisma.completion.findMany({
      where,
      orderBy: { completedAt: "desc" },
      include: {
        chore: {
          select: { id: true, title: true, points: true },
        },
        member: {
          select: { id: true, displayName: true },
        },
      },
    })

    return NextResponse.json({
      completions: completions.map((c) => ({
        id: c.id,
        choreId: c.choreId,
        choreTitle: c.chore.title,
        memberId: c.memberId,
        memberName: c.member.displayName,
        completedAt: c.completedAt.toISOString(),
        scheduledFor: c.scheduledFor?.toISOString() || null,
        photoUrl: c.photoUrl,
        notes: c.notes,
        status: c.status,
        points: c.chore.points,
        pointsAwarded: c.pointsAwarded,
        approvedAt: c.approvedAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error("Get completions error:", error)
    return Errors.internal()
  }
}
