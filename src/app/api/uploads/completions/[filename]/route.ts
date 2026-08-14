import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { Errors, withFlatErrorHandling } from "@/lib/errors"

/**
 * GET /api/uploads/completions/:filename
 *
 * Serve completion photos with authentication.
 * Only family members can view photos from their family.
 */
export const GET = withFlatErrorHandling(async (_request, context) => {
  const { filename } = await context.params

  const { member } = await requireAuth()

  // Find completion by photo URL
  const completion = await prisma.completion.findFirst({
    where: {
      photoUrl: `/uploads/completions/${filename}`,
    },
    include: {
      chore: true,
      member: true,
    },
  })

  if (!completion) {
    throw Errors.notFound("Photo")
  }

  // Verify member belongs to the same family as the completion
  if (completion.chore.familyId !== member.familyId) {
    throw Errors.forbidden("Access denied")
  }

  // Read and serve the file
  const filePath = path.join(process.cwd(), "public", "uploads", "completions", filename)

  try {
    const fileBuffer = await fs.readFile(filePath)

    // Determine content type from file extension
    const ext = path.extname(filename).toLowerCase()
    const contentType = ext === ".png" ? "image/png" : "image/jpeg"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (fileError) {
    console.error("File read error:", fileError)
    throw Errors.notFound("Photo")
  }
})
