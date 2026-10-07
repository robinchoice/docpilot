import * as core from '@actions/core'
import type { ActionInputs } from './types.js'

export function parseInputs(): ActionInputs {
  const excludeRaw = core.getInput('exclude-patterns')
  const labelsRaw = core.getInput('pr-labels')
  const reviewersRaw = core.getInput('pr-reviewers')

  return {
    apiKey: core.getInput('api-key', { required: true }),
    apiBaseUrl: core.getInput('api-base-url') || 'https://openrouter.ai/api/v1',
    model: core.getInput('model') || 'anthropic/claude-haiku-4-5-20251001',
    targetFile: core.getInput('target-file') || 'README.md',
    githubToken: core.getInput('github-token', { required: true }),
    excludePatterns: excludeRaw ? excludeRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    prLabels: labelsRaw ? labelsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    prReviewers: reviewersRaw ? reviewersRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    maxFileSize: parseInt(core.getInput('max-file-size') || '51200', 10),
  }
}
