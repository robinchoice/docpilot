import * as exec from '@actions/exec'
import * as core from '@actions/core'
import type { GitHub } from '@actions/github/lib/utils.js'
import type { Context } from '@actions/github/lib/context.js'
import type { ChangedFile } from './types.js'

const EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

export async function getChangedFiles(
  octokit: InstanceType<typeof GitHub>,
  context: Context
): Promise<ChangedFile[]> {
  const before = (context.payload as { before?: string }).before ?? ''
  const after = context.sha

  const isInitialCommit = !before || before === '0000000000000000000000000000000000000000'
  const baseSha = isInitialCommit ? EMPTY_TREE_SHA : before

  try {
    return await getChangedFilesViaGit(baseSha, after)
  } catch (err) {
    core.warning(`git diff failed, falling back to GitHub API: ${err}`)
    return getChangedFilesViaApi(octokit, context, baseSha, after, isInitialCommit)
  }
}

async function getChangedFilesViaGit(baseSha: string, headSha: string): Promise<ChangedFile[]> {
  let diffOutput = ''
  await exec.exec('git', ['diff', '--unified=3', baseSha, headSha], {
    listeners: {
      stdout: (data: Buffer) => { diffOutput += data.toString() },
    },
    silent: true,
  })

  let nameStatusOutput = ''
  await exec.exec('git', ['diff', '--name-status', baseSha, headSha], {
    listeners: {
      stdout: (data: Buffer) => { nameStatusOutput += data.toString() },
    },
    silent: true,
  })

  return parseGitDiff(nameStatusOutput, diffOutput)
}

function parseGitDiff(nameStatus: string, diff: string): ChangedFile[] {
  const fileMap = new Map<string, Pick<ChangedFile, 'status' | 'patch'>>()

  for (const line of nameStatus.trim().split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    const statusChar = parts[0][0]
    const filename = parts[parts.length - 1]

    let status: ChangedFile['status'] = 'modified'
    if (statusChar === 'A') status = 'added'
    else if (statusChar === 'D') status = 'removed'
    else if (statusChar === 'R') status = 'renamed'

    fileMap.set(filename, { status, patch: '' })
  }

  // Parse patches from unified diff
  const filePatches = splitDiffByFile(diff)
  for (const [filename, patch] of filePatches) {
    const entry = fileMap.get(filename)
    if (entry) entry.patch = patch
  }

  return Array.from(fileMap.entries()).map(([filename, data]) => ({
    filename,
    ...data,
  }))
}

function splitDiffByFile(diff: string): Map<string, string> {
  const result = new Map<string, string>()
  const lines = diff.split('\n')
  let currentFile = ''
  let currentPatch: string[] = []

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (currentFile && currentPatch.length > 0) {
        result.set(currentFile, currentPatch.join('\n'))
      }
      // Extract filename: "diff --git a/foo.ts b/foo.ts" → "foo.ts"
      const match = line.match(/diff --git a\/(.+) b\/(.+)/)
      currentFile = match ? match[2] : ''
      currentPatch = [line]
    } else {
      currentPatch.push(line)
    }
  }

  if (currentFile && currentPatch.length > 0) {
    result.set(currentFile, currentPatch.join('\n'))
  }

  return result
}

async function getChangedFilesViaApi(
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  baseSha: string,
  headSha: string,
  isInitialCommit: boolean
): Promise<ChangedFile[]> {
  const { owner, repo } = context.repo

  if (isInitialCommit) {
    const { data: commit } = await octokit.rest.repos.getCommit({
      owner, repo, ref: headSha,
    })
    return (commit.files ?? []).map(f => ({
      filename: f.filename,
      status: 'added' as const,
      patch: f.patch ?? '',
    }))
  }

  const { data } = await octokit.rest.repos.compareCommits({
    owner, repo, base: baseSha, head: headSha,
  })

  return (data.files ?? []).map(f => ({
    filename: f.filename,
    status: mapApiStatus(f.status),
    patch: f.patch ?? '',
  }))
}

function mapApiStatus(status: string): ChangedFile['status'] {
  if (status === 'added') return 'added'
  if (status === 'removed') return 'removed'
  if (status === 'renamed') return 'renamed'
  return 'modified'
}
