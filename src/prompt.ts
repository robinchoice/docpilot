import type { ChangedFile } from './types.js'

export const SYSTEM_PROMPT = `You are docpilot, a documentation maintenance assistant. Your job is to update a project's documentation file based on code changes. Follow these rules strictly:

1. ONLY update sections that are directly affected by the code changes shown. If a section is unaffected, return it EXACTLY as-is, character for character.

2. NEVER invent, assume, or hallucinate information not present in the provided code or diff. If you are unsure what a change does, leave that section unchanged.

3. PRESERVE the existing structure, formatting style, heading levels, and tone. Match the existing writing style.

4. Make minimal targeted edits. Add new information where needed, remove information that is no longer accurate. Do not rewrite sentences that are still correct.

5. Return the COMPLETE updated file (all sections), not just the changed parts. Unchanged sections must be returned verbatim.

6. Wrap the full updated file in <updated_content> tags.

7. After the closing tag, add a single line starting with DOCPILOT_SUMMARY: followed by a brief description of what changed and why.`

// Rough token estimate: 1 token ≈ 4 chars
const CHARS_PER_TOKEN = 4
const MAX_CONTEXT_TOKENS = 150_000
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN

// Priority order for files when trimming context
const PRIORITY_FILENAMES = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.py', 'package.json', 'Cargo.toml', 'go.mod', 'pyproject.toml']

export function buildPrompt(
  currentContent: string,
  targetFile: string,
  changedFiles: ChangedFile[],
  fileContents: Map<string, string>
): { system: string; user: string } {
  const diffSection = buildDiffSection(changedFiles)
  const baseMessage = buildBaseMessage(currentContent, targetFile, diffSection)

  const prioritized = prioritizeFiles(changedFiles, fileContents)
  const fileSection = buildFileSectionWithBudget(
    prioritized,
    MAX_CONTEXT_CHARS - baseMessage.length - SYSTEM_PROMPT.length
  )

  return {
    system: SYSTEM_PROMPT,
    user: baseMessage + fileSection + '\n\nUpdate the documentation file shown above to reflect these code changes.',
  }
}

function buildBaseMessage(currentContent: string, targetFile: string, diffSection: string): string {
  return `## Current ${targetFile}

<current_content>
${currentContent}
</current_content>

## Git Diff (what changed in this push)

<diff>
${diffSection}
</diff>

`
}

function buildDiffSection(changedFiles: ChangedFile[]): string {
  return changedFiles
    .filter(f => f.patch)
    .map(f => f.patch)
    .join('\n\n')
}

function prioritizeFiles(
  changedFiles: ChangedFile[],
  fileContents: Map<string, string>
): Array<{ filename: string; content: string }> {
  const entries: Array<{ filename: string; content: string; priority: number }> = []

  for (const [filename, content] of fileContents) {
    const basename = filename.split('/').pop() ?? ''
    const priorityIdx = PRIORITY_FILENAMES.indexOf(basename)
    const priority = priorityIdx >= 0 ? priorityIdx : PRIORITY_FILENAMES.length

    // Boost files mentioned in existing README (simple heuristic: filename appears in diff)
    const inDiff = changedFiles.some(f => f.patch.includes(basename))
    const finalPriority = inDiff ? priority - 100 : priority

    entries.push({ filename, content, priority: finalPriority })
  }

  return entries
    .sort((a, b) => a.priority - b.priority)
    .map(({ filename, content }) => ({ filename, content }))
}

function buildFileSectionWithBudget(
  files: Array<{ filename: string; content: string }>,
  budgetChars: number
): string {
  if (files.length === 0) return ''

  const parts: string[] = ['## Changed File Contents\n']
  let remaining = budgetChars - parts[0].length

  for (const { filename, content } of files) {
    const block = `\n<file path="${filename}">\n${content}\n</file>\n`
    if (block.length > remaining) {
      // Try truncated version
      const truncated = `\n<file path="${filename}">\n${content.slice(0, Math.max(0, remaining - 200))}\n[... truncated ...]\n</file>\n`
      if (truncated.length <= remaining) {
        parts.push(truncated)
        remaining -= truncated.length
      }
      break
    }
    parts.push(block)
    remaining -= block.length
  }

  return parts.join('')
}
