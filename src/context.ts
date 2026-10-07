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
    try {
      const path = resolve(workspace, filename)
      if ((await lstat(path)).isSymbolicLink()) return null
      const actualPath = await realpath(path)
      if (!actualPath.startsWith(workspace + sep)) return null
      return await readFile(actualPath, 'utf-8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw err
    }
  }
  const currentContent = await readWorkspaceFile(targetFile) ?? ''

  const contents = await Promise.all(changedFiles
    .filter(file => file.status !== 'removed' && file.filename !== targetFile)
    .map(async file => {
      const content = await readWorkspaceFile(file.filename)
      if (content === null) return null
      if (content.length <= maxFileSize) return [file.filename, content] as const
      const truncated = content.split('\n').slice(0, 200).join('\n')
      return [file.filename, truncated + '\n[... truncated ...]'] as const
    }))
  const fileContents = new Map(contents.filter(entry => entry !== null))

  return { currentContent, fileContents }
}
