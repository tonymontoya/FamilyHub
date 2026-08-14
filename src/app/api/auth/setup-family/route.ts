import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Input validation constants
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 50
const MAX_FAMILY_NAME_LENGTH = 50

/**
 * Validates that a value is a non-empty string within length constraints
 */
function validateName(
  value: unknown,
  fieldName: string,
  minLength: number = MIN_NAME_LENGTH,
  maxLength: number = MAX_NAME_LENGTH
): { valid: false; error: string } | { valid: true; value: string } {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` }
  }

  const trimmed = value.trim()

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` }
  }

  return { valid: true, value: trimmed }
}

/**
 * POST /api/auth/setup-family
 *
 * Idempotent endpoint to create a family and parent member after Better-Auth registration.
 * Safe to retry if the initial request fails - will return existing data if already set up.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      )
    }

    const { familyName, parentName } = body as Record<string, unknown>

    // Validate inputs
    const familyNameValidation = validateName(
      familyName,
      "Family name",
      MIN_NAME_LENGTH,
      MAX_FAMILY_NAME_LENGTH
    )
    if (!familyNameValidation.valid) {
      return NextResponse.json(
        { error: familyNameValidation.error },
        { status: 400 }
      )
    }

    const parentNameValidation = validateName(parentName, "Parent name")
    if (!parentNameValidation.valid) {
      return NextResponse.json(
        { error: parentNameValidation.error },
        { status: 400 }
      )
    }

    const normalizedFamilyName = familyNameValidation.value
    const normalizedParentName = parentNameValidation.value
    const username = session.user.email

    // Check if user already has a member record (idempotency)
    const existingMember = await prisma.member.findUnique({
      where: { userId: session.user.id },
    })

    if (existingMember) {
      // User already set up - return existing data
      return NextResponse.json({
        success: true,
        familyId: existingMember.familyId,
        memberId: existingMember.id,
        alreadyExists: true,
      })
    }

    // Create family and member in a transaction
    // This handles the race condition where two requests arrive simultaneously
    let result: { familyId: string; memberId: string; alreadyExists: boolean }

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        // Double-check within transaction (prevents race condition)
        const existingInTx = await tx.member.findUnique({
          where: { userId: session.user.id },
        })

        if (existingInTx) {
          return {
            familyId: existingInTx.familyId,
            memberId: existingInTx.id,
            alreadyExists: true,
          }
        }

        // Create family
        const family = await tx.family.create({
          data: {
            name: normalizedFamilyName,
          },
        })

        // Create parent member linked to family
        const member = await tx.member.create({
          data: {
            familyId: family.id,
            userId: session.user.id,
            role: "PARENT",
            username,
            displayName: normalizedParentName,
          },
        })

        return {
          familyId: family.id,
          memberId: member.id,
          alreadyExists: false,
        }
      }, {
        // Transaction options for safety
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: 5000,
      })

      result = txResult
    } catch (txError) {
      // Handle unique constraint violation (race condition)
      // P2002 = Unique constraint failed
      if (
        txError instanceof Prisma.PrismaClientKnownRequestError &&
        txError.code === "P2002"
      ) {
        // Another request won the race - fetch the existing record
        const raceConditionMember = await prisma.member.findUnique({
          where: { userId: session.user.id },
        })

        if (raceConditionMember) {
          return NextResponse.json({
            success: true,
            familyId: raceConditionMember.familyId,
            memberId: raceConditionMember.id,
            alreadyExists: true,
          })
        }
      }

      throw txError
    }

    return NextResponse.json({
      success: true,
      familyId: result.familyId,
      memberId: result.memberId,
      alreadyExists: result.alreadyExists,
    })
  } catch (error) {
    console.error("Family setup error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
