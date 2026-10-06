import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseInputs } from './inputs.js'
import { getChangedFiles } from './diff.js'
import { filterFiles } from './filter.js'
import { gatherContext } from './context.js'
import { buildPrompt } from './prompt.js'
import { callLLM } from './llm.js'
import { createOrUpdatePR } from './pr.js'

async function run(): Promise<void> {
  const inputs = parseInputs()
  const octokit = github.getOctokit(inputs.githubToken)
  core.setOutput('updated', 'false')
  core.setOutput('pr-url', '')

  core.info('docpilot: analyzing push...')

  // 1. Get changed files
  const allFiles = await getChangedFiles(octokit, github.context)
  core.info(`${allFiles.length} file(s) changed in push`)

  // 2. Filter irrelevant files
  const relevantFiles = filterFiles(allFiles, inputs.excludePatterns)
    .filter(file => file.filename !== inputs.targetFile)
  core.info(`${relevantFiles.length} file(s) after filtering`)

  if (relevantFiles.length === 0) {
    core.info('No relevant files changed. Nothing to do.')
    return
  }

  // 3. Gather context
  const { currentContent, fileContents } = await gatherContext(
    relevantFiles, inputs.targetFile, inputs.maxFileSize
  )

  if (!currentContent) {
    core.warning(`${inputs.targetFile} not found. Skipping — docpilot v1 only updates existing files.`)
    return
  }

  // 4. Build prompt
  const { system, user } = buildPrompt(
    currentContent, inputs.targetFile, relevantFiles, fileContents
  )

  // 5. Call LLM
  core.info(`Calling ${inputs.model} via ${inputs.apiBaseUrl}...`)
  const result = await callLLM(inputs.apiKey, inputs.apiBaseUrl, inputs.model, system, user)

  // 6. Check if content actually changed
  if (result.updatedContent.trim() === currentContent.trim()) {
    core.info('LLM determined no documentation updates needed.')
    return
  }

  // Warn when the new content differs substantially in length
  const lengthRatio = Math.min(currentContent.length, result.updatedContent.length) /
    Math.max(currentContent.length, result.updatedContent.length)
  if (lengthRatio < 0.4) {
    core.warning(
      `${inputs.targetFile} length differs by >60% of the longer version. ` +
      'This may indicate a hallucination. ' +
      'Review the PR carefully before merging.'
    )
  }

  // 7. Create PR
  core.info(`${inputs.targetFile} updated. Creating PR...`)
  const prUrl = await createOrUpdatePR(
    octokit, github.context,
    result.updatedContent, inputs.targetFile,
    result.summary,
    inputs.prLabels, inputs.prReviewers
  )

  core.setOutput('updated', 'true')
  core.setOutput('pr-url', prUrl)
  core.info(`PR ready: ${prUrl}`)
}

run().catch(err => {
  core.setFailed(err instanceof Error ? err.message : String(err))
})
