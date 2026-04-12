/**
 * File Upload Constants
 * 
 * These constants can be imported by both server and client code.
 */

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed MIME types
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const
