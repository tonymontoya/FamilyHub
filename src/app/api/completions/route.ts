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
      return Errors.badRequest(
        "Invalid form data. Ensure file is under 5MB and is a JPEG/PNG image."
      )
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
      return Errors.badRequest("Invalid completedAt date")
    }

    // Prevent future dates
    if (completedAt > new Date()) {
      return Errors.badRequest("Completion date cannot be in the future")
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
    // - CHILD can only complete chores assigned to them
    if (member.role === "CHILD") {
      if (chore.assigneeId && chore.assigneeId !== member.id) {
        return Errors.forbidden("Not assigned to this chore")
      }
    }

    // Handle file upload if present
    let photoUrl: string | null = null
    const file = files.photo?.[0]

    if (file) {
      // Validate file metadata
      const metadataValidation = validateFileMetadata({
        mimetype: file.mimetype || undefined,
        size: file.size,
        originalFilename: file.originalFilename,
      })

      if (!metadataValidation.valid) {
        // Clean up temp file
        try {
          await fs.unlink(file.filepath)
        } catch {}
        return Errors.badRequest(metadataValidation.error || "Invalid file")
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
        return Errors.badRequest(
          "Failed to save photo. Ensure it is a valid JPEG or PNG image."
        )
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

    // Idempotent completion: Check for existing completion
    const existingCompletion = await prisma.completion.findFirst({
      where: {
        choreId: validatedChoreId,
        memberId: member.id,
        completedAt: {
          gte: scheduledFor,
          lt: new Date(scheduledFor.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    })

    let completion
    const isUpdate = !!existingCompletion

    if (existingCompletion) {
      // Update existing completion (idempotent)
      // If new photo uploaded, delete old one
      if (photoUrl && existingCompletion.photoUrl) {
        const oldPath = path.join(
          process.cwd(),
          "public",
          existingCompletion.photoUrl
        )
        try {
          await deleteFile(oldPath)
        } catch (deleteError) {
          console.error("Failed to delete old photo:", deleteError)
        }
      }

      completion = await prisma.completion.update({
        where: { id: existingCompletion.id },
        data: {
          photoUrl: photoUrl || existingCompletion.photoUrl,
          notes: sanitizedNotes ?? existingCompletion.notes,
          completedAt: completedAt,
          scheduledFor: scheduledFor,
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
    } else {
      // Create new completion
      completion = await prisma.completion.create({
        data: {
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
      return Errors.conflict(
        "Completion already exists for this chore and date"
      )
    }

    return Errors.internal()
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
