import { minimatch } from 'minimatch'
import type { ChangedFile } from './types.js'

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.pyc', '.class',
])

export function filterFiles(
  files: ChangedFile[],
  excludePatterns: string[],
  maxFileSize: number
): ChangedFile[] {
  return files.filter(file => {
    if (isBinary(file.filename)) return false
    if (matchesExcludePattern(file.filename, excludePatterns)) return false
    if (file.content && file.content.length > maxFileSize) return false
    return true
  })
}

function isBinary(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return BINARY_EXTENSIONS.has(ext)
}

function matchesExcludePattern(filename: string, patterns: string[]): boolean {
  return patterns.some(pattern =>
    minimatch(filename, pattern, { matchBase: true, dot: true })
  )
}
