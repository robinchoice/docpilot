import { lstat, readFile, realpath } from 'fs/promises'
import { resolve, sep } from 'path'
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
  const workspace = await realpath(process.env.GITHUB_WORKSPACE || process.cwd())
  const readWorkspaceFile = async (filename: string): Promise<string | null> => {
    const path = resolve(workspace, filename)
    if ((await lstat(path)).isSymbolicLink()) return null
    const actualPath = await realpath(path)
    if (!actualPath.startsWith(workspace + sep)) return null
    return readFile(actualPath, 'utf-8')
  }
  const currentContent = await readWorkspaceFile(targetFile).catch(() => null) ?? ''

  const fileContents = new Map<string, string>()
  for (const file of changedFiles) {
    if (file.status === 'removed') continue
    if (file.filename === targetFile) continue
    try {
      const content = await readWorkspaceFile(file.filename)
      if (content === null) continue
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
