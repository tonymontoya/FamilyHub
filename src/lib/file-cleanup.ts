/**
 * File Cleanup Utility
 * 
 * MVP LIMITATION: This module provides cleanup for orphaned files.
 * In production, a cron job or scheduled function should call these methods.
 * 
 * Orphaned files can occur when:
 * - Completion is updated with new photo (old photo deleted)
 * - Database transaction fails after file upload
 * - Completion is deleted (soft delete retains photo for audit)
 */

import { promises as fs } from "fs"
import path from "path"
import { prisma } from "./prisma"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "completions")

/**
 * Find all files in the upload directory
 */
async function getUploadedFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    return files.filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png"))
  } catch {
    return []
  }
}

/**
 * Find all photo URLs referenced in the database
 */
async function getReferencedPhotos(): Promise<Set<string>> {
  const completions = await prisma.completion.findMany({
    where: { photoUrl: { not: null } },
    select: { photoUrl: true },
  })
  
  return new Set(completions.map(c => c.photoUrl).filter(Boolean) as string[])
}

/**
 * Clean up orphaned files (files not referenced in database)
 * 
 * WARNING: This permanently deletes files. Use with caution.
 * 
 * @param dryRun If true, only report what would be deleted
 * @returns Summary of cleanup operation
 */
export async function cleanupOrphanedFiles(
  dryRun = true
): Promise<{
  scanned: number
  orphaned: number
  deleted: number
  errors: string[]
}> {
  const result = {
    scanned: 0,
    orphaned: 0,
    deleted: 0,
    errors: [] as string[],
  }

  try {
    // Get all files and referenced photos
    const [files, referencedPhotos] = await Promise.all([
      getUploadedFiles(),
      getReferencedPhotos(),
    ])

    result.scanned = files.length

    // Check each file
    for (const filename of files) {
      const publicUrl = `/api/uploads/completions/${filename}`
      const legacyUrl = `/uploads/completions/${filename}`
      
      // File is orphaned if not referenced by either URL format
      if (!referencedPhotos.has(publicUrl) && !referencedPhotos.has(legacyUrl)) {
        result.orphaned++
        
        if (!dryRun) {
          try {
            await fs.unlink(path.join(UPLOAD_DIR, filename))
            result.deleted++
          } catch (error) {
            result.errors.push(`Failed to delete ${filename}: ${(error as Error).message}`)
          }
        }
      }
    }
  } catch (error) {
    result.errors.push(`Cleanup failed: ${(error as Error).message}`)
  }

  return result
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number
  totalSize: number
  orphanedCount: number
  referencedCount: number
}> {
  const [files, referencedPhotos] = await Promise.all([
    getUploadedFiles(),
    getReferencedPhotos(),
  ])

  let totalSize = 0
  let orphanedCount = 0

  for (const filename of files) {
    try {
      const stats = await fs.stat(path.join(UPLOAD_DIR, filename))
      totalSize += stats.size
      
      const publicUrl = `/api/uploads/completions/${filename}`
      const legacyUrl = `/uploads/completions/${filename}`
      
      if (!referencedPhotos.has(publicUrl) && !referencedPhotos.has(legacyUrl)) {
        orphanedCount++
      }
    } catch {
      // Ignore files we can't stat
    }
  }

  return {
    totalFiles: files.length,
    totalSize,
    orphanedCount,
    referencedCount: referencedPhotos.size,
  }
}
