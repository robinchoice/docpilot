import * as exec from '@actions/exec'
import * as core from '@actions/core'
import type { ChangedFile, Context, Octokit } from './types.js'

const EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

export async function getChangedFiles(
  octokit: Octokit,
  context: Context
): Promise<ChangedFile[]> {
  let before = (context.payload as { before?: string }).before ?? ''
  const after = context.sha

  if (context.eventName === 'workflow_dispatch') {
    const { data: commit } = await octokit.rest.repos.getCommit({
      ...context.repo, ref: after,
    })
    before = commit.parents[0]?.sha ?? ''
  }

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
  const [diff, nameStatus] = await Promise.all([
    exec.getExecOutput('git', ['-c', 'core.quotepath=false', 'diff', '--unified=3', baseSha, headSha], { silent: true }),
    exec.getExecOutput('git', ['-c', 'core.quotepath=false', 'diff', '--name-status', baseSha, headSha], { silent: true }),
  ])

  return parseGitDiff(nameStatus.stdout, diff.stdout)
}

export function parseGitDiff(nameStatus: string, diff: string): ChangedFile[] {
  const files: ChangedFile[] = []

  for (const line of nameStatus.split('\n')) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    const statusChar = parts[0][0]
    const filename = parts[parts.length - 1]

    let status: ChangedFile['status'] = 'modified'
    if (statusChar === 'A') status = 'added'
    else if (statusChar === 'D') status = 'removed'
    else if (statusChar === 'R') status = 'renamed'

    files.push({ filename, status, patch: '' })
  }

  // Patch headers look like "diff --git a/old b/new". Match the new name against
  // the known files, longest first, because paths may themselves contain " b/".
  const byLength = [...files].sort((a, b) => b.filename.length - a.filename.length)
  let current: ChangedFile | undefined
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = byLength.find(file => line.endsWith(` b/${file.filename}`))
      if (current) current.patch = line
    } else if (current) {
      current.patch += '\n' + line
    }
  }

  return files
}

async function getChangedFilesViaApi(
  octokit: Octokit,
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
