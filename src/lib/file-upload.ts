/**
 * File Upload Utilities
 *
 * Handles file validation, storage, and security for uploads.
 * MVP: Local filesystem storage
 * Future: S3/MinIO with presigned URLs
 */

import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const
export const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/completions"

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface FileUploadResult {
  filename: string
  filepath: string
  publicUrl: string
  size: number
  mimetype: string
}

/**
 * Validate file metadata (size, type)
 */
export function validateFileMetadata(
  file: {
    mimetype?: string
    size?: number
    originalFilename?: string | null
  },
  options: {
    maxSize?: number
    allowedTypes?: readonly string[]
  } = {}
): FileValidationResult {
  const maxSize = options.maxSize || MAX_FILE_SIZE
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES

  // Check file exists
  if (!file || !file.size) {
    return { valid: false, error: "No file provided" }
  }

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatBytes(maxSize)}.`,
    }
  }

  // Check MIME type
  if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}.`,
    }
  }

  // Check extension (additional safety)
  const ext = path.extname(file.originalFilename || "").toLowerCase()
  if (ext && !ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    }
  }

  return { valid: true }
}

/**
 * Validate file content using magic numbers
 * Prevents disguised file types (e.g., .exe renamed to .jpg)
 */
export async function validateMagicNumbers(
  filepath: string
): Promise<FileValidationResult> {
  try {
    const buffer = await fs.readFile(filepath, { encoding: null, flag: "r" })
    
    if (buffer.length < 4) {
      return { valid: false, error: "File too small to be valid image" }
    }

    // JPEG magic number: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    
    // PNG magic number: 89 50 4E 47
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && 
                  buffer[2] === 0x4e && buffer[3] === 0x47

    if (!isJpeg && !isPng) {
      return { valid: false, error: "File content does not match allowed image types" }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: "Failed to validate file content" }
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename)
  
  // Remove non-alphanumeric characters except safe ones
  let safe = basename.replace(/[^a-zA-Z0-9.-]/g, "_")
  
  // Remove leading dots (prevents hidden files)
  safe = safe.replace(/^[._]+/, "")
  
  // Remove trailing dots (prevents extension confusion)
  safe = safe.replace(/[._]+$/, "")
  
  // Ensure not empty
  if (!safe) {
    return "file"
  }
  
  return safe
}

/**
 * Generate a safe unique filename
 */
export function generateSafeFilename(
  originalFilename: string | null,
  prefix?: string
): string {
  const id = uuidv4()
  const timestamp = Date.now()
  const prefixStr = prefix ? `${prefix}-` : ""
  
  if (originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase()
    if (ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      return `${prefixStr}${id}-${timestamp}${ext}`
    }
  }
  
  // Default to .jpg if no valid extension
  return `${prefixStr}${id}-${timestamp}.jpg`
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDirectory(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Save file to disk with validation
 */
export async function saveFile(
  tempFilePath: string,
  originalFilename: string | null,
  options: {
    prefix?: string
    validateContent?: boolean
  } = {}
): Promise<FileUploadResult> {
  // Ensure upload directory exists
  await ensureUploadDirectory()

  // Validate magic numbers (security check)
  if (options.validateContent !== false) {
    const magicResult = await validateMagicNumbers(tempFilePath)
    if (!magicResult.valid) {
      // Clean up temp file
      try {
        await fs.unlink(tempFilePath)
      } catch {}
      throw new Error(magicResult.error || "Invalid file content")
    }
  }

  // Generate safe filename
  const filename = generateSafeFilename(originalFilename, options.prefix)
  const filepath = path.join(UPLOAD_DIR, filename)

  // Ensure the resolved path is within upload directory (path traversal check)
  const resolvedPath = path.resolve(filepath)
  const resolvedUploadDir = path.resolve(UPLOAD_DIR)
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    try {
      await fs.unlink(tempFilePath)
    } catch {}
    throw new Error("Invalid file path")
  }

  // Move file from temp to final location
  await fs.rename(tempFilePath, filepath)

  // Get file stats
  const stats = await fs.stat(filepath)

  // Determine mimetype from magic number
  const buffer = await fs.readFile(filepath, { encoding: null, flag: "r" })
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8
  const mimetype = isJpeg ? "image/jpeg" : "image/png"

  return {
    filename,
    filepath,
    publicUrl: `/api/uploads/completions/${filename}`,
    size: stats.size,
    mimetype,
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath)
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error
    }
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
