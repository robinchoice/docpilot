import { readFile } from 'fs/promises'
import type { ChangedFile } from './types.js'

export interface GatheredContext {
  currentContent: string
  fileContents: Map<string, string>
}

export async function gatherContext(
  changedFiles: ChangedFile[],
  targetFile: string,
  maxFileSize: number
): Promise<GatheredContext> {
  const currentContent = await readFile(targetFile, 'utf-8').catch(() => '')

  const fileContents = new Map<string, string>()
  for (const file of changedFiles) {
    if (file.status === 'removed') continue
    if (file.filename === targetFile) continue
    try {
      const content = await readFile(file.filename, 'utf-8')
      if (content.length <= maxFileSize) {
        fileContents.set(file.filename, content)
      } else {
        // Include only first 200 lines for oversized files
        const truncated = content.split('\n').slice(0, 200).join('\n')
        fileContents.set(file.filename, truncated + '\n[... truncated ...]')
      }
    } catch {
      // File might not exist (e.g. in a shallow clone) — skip silently
    }
  }

  return { currentContent, fileContents }
}
