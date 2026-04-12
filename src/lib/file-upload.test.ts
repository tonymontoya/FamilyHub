import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { promises as fs } from "fs"
import path from "path"
import { tmpdir } from "os"
import {
  validateFileMetadata,
  validateMagicNumbers,
  sanitizeFilename,
  generateSafeFilename,
  formatBytes,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "./file-upload"

describe("validateFileMetadata", () => {
  it("accepts valid JPEG file", () => {
    const result = validateFileMetadata({
      mimetype: "image/jpeg",
      size: 1024 * 1024, // 1MB
      originalFilename: "photo.jpg",
    })
    expect(result.valid).toBe(true)
  })

  it("accepts valid PNG file", () => {
    const result = validateFileMetadata({
      mimetype: "image/png",
      size: 1024 * 1024,
      originalFilename: "photo.png",
    })
    expect(result.valid).toBe(true)
  })

  it("rejects file that's too large", () => {
    const result = validateFileMetadata({
      mimetype: "image/jpeg",
      size: MAX_FILE_SIZE + 1,
      originalFilename: "photo.jpg",
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain("too large")
  })

  it("rejects invalid MIME type", () => {
    const result = validateFileMetadata({
      mimetype: "application/pdf",
      size: 1024,
      originalFilename: "doc.pdf",
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid file type")
  })

  it("rejects invalid file extension", () => {
    const result = validateFileMetadata({
      mimetype: "image/jpeg",
      size: 1024,
      originalFilename: "photo.exe",
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain("Invalid file extension")
  })

  it("rejects missing file", () => {
    const result = validateFileMetadata({
      mimetype: undefined,
      size: 0,
      originalFilename: null,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain("No file provided")
  })

  it("accepts file with no extension", () => {
    const result = validateFileMetadata({
      mimetype: "image/jpeg",
      size: 1024,
      originalFilename: "photo",
    })
    expect(result.valid).toBe(true)
  })
})

describe("validateMagicNumbers", () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), "upload-test-"))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("accepts valid JPEG by magic number", async () => {
    const filepath = path.join(tempDir, "valid.jpg")
    // JPEG magic number: FF D8 FF
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    await fs.writeFile(filepath, buffer)

    const result = await validateMagicNumbers(filepath)
    expect(result.valid).toBe(true)
  })

  it("accepts valid PNG by magic number", async () => {
    const filepath = path.join(tempDir, "valid.png")
    // PNG magic number: 89 50 4E 47
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
    await fs.writeFile(filepath, buffer)

    const result = await validateMagicNumbers(filepath)
    expect(result.valid).toBe(true)
  })

  it("rejects file with wrong magic number", async () => {
    const filepath = path.join(tempDir, "fake.jpg")
    // GIF magic number (disguised as JPEG)
    const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38])
    await fs.writeFile(filepath, buffer)

    const result = await validateMagicNumbers(filepath)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("does not match")
  })

  it("rejects file that's too small", async () => {
    const filepath = path.join(tempDir, "tiny.jpg")
    await fs.writeFile(filepath, Buffer.from([0xff]))

    const result = await validateMagicNumbers(filepath)
    expect(result.valid).toBe(false)
    expect(result.error).toContain("too small")
  })

  it("rejects non-existent file", async () => {
    const result = await validateMagicNumbers(path.join(tempDir, "nonexistent.jpg"))
    expect(result.valid).toBe(false)
  })
})

describe("sanitizeFilename", () => {
  it("removes path traversal attempts", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd")
    expect(sanitizeFilename("..\\..\\windows\\system32")).toBe("windows_system32")
  })

  it("removes special characters", () => {
    expect(sanitizeFilename("file@#$%^&*name.jpg")).toBe("file_______name.jpg")
  })

  it("preserves alphanumeric, dots, and dashes", () => {
    expect(sanitizeFilename("my-file_v2.0.jpg")).toBe("my-file_v2.0.jpg")
  })

  it("handles empty filename", () => {
    expect(sanitizeFilename("")).toBe("file")
    expect(sanitizeFilename("...")).toBe("file")
  })

  it("handles only special chars", () => {
    expect(sanitizeFilename("@#$%")).toBe("file")
  })
})

describe("generateSafeFilename", () => {
  it("includes UUID and timestamp", () => {
    const filename = generateSafeFilename("photo.jpg")
    expect(filename).toMatch(/^[a-f0-9-]+-\d+\.jpg$/)
  })

  it("preserves valid extension", () => {
    expect(generateSafeFilename("photo.jpg")).toMatch(/\.jpg$/)
    expect(generateSafeFilename("photo.jpeg")).toMatch(/\.jpeg$/)
    expect(generateSafeFilename("photo.png")).toMatch(/\.png$/)
  })

  it("defaults to .jpg for invalid extension", () => {
    expect(generateSafeFilename("photo.exe")).toMatch(/\.jpg$/)
    expect(generateSafeFilename("photo")).toMatch(/\.jpg$/)
  })

  it("includes prefix when provided", () => {
    const filename = generateSafeFilename("photo.jpg", "completion")
    expect(filename).toMatch(/^completion-/)
  })

  it("handles null filename", () => {
    const filename = generateSafeFilename(null)
    expect(filename).toMatch(/\.jpg$/)
  })
})

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes")
    expect(formatBytes(1024)).toBe("1 KB")
    expect(formatBytes(1024 * 1024)).toBe("1 MB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB")
  })

  it("formats with decimal places", () => {
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(1536000)).toBe("1.46 MB")
  })
})
