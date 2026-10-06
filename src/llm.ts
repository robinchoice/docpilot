import OpenAI from 'openai'
import * as core from '@actions/core'
import type { UpdateResult } from './types.js'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 5000

export async function callLLM(
  apiKey: string,
  apiBaseUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<UpdateResult> {
  const client = new OpenAI({ apiKey, baseURL: apiBaseUrl })

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      core.info(`Retry ${attempt}/${MAX_RETRIES} after ${RETRY_DELAY_MS}ms...`)
      await sleep(RETRY_DELAY_MS * attempt)
    }

    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      })

      const text = response.choices[0]?.message?.content ?? ''
      return parseResponse(text)
    } catch (err) {
      const error = err as { status?: number; message?: string }
      if (error.status === 429) {
        lastError = new Error(error.message ?? 'Rate limited')
        continue
      }
      throw new Error(`LLM API error: ${error.message ?? String(err)}`)
    }
  }

  throw lastError ?? new Error('LLM call failed after retries')
}

export function parseResponse(text: string): UpdateResult {
  const contentMatch = text.match(/<updated_content>([\s\S]*?)<\/updated_content>/)
  if (!contentMatch) {
    throw new Error(
      'LLM response did not contain <updated_content> tags. Raw response:\n' +
      text.slice(0, 500)
    )
  }

  const updatedContent = contentMatch[1].trim()

  const summaryMatch = text.match(/DOCPILOT_SUMMARY:\s*(.+)/)
  const summary = summaryMatch ? summaryMatch[1].trim() : 'Documentation updated by docpilot'

  return { updatedContent, summary }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
