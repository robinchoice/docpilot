import { describe, it, expect } from 'vitest'
import { buildPrompt, SYSTEM_PROMPT } from '../src/prompt.js'
import type { ChangedFile } from '../src/types.js'

const README = `# My Project

## Installation

Run \`npm install\`.

## Usage

Call \`myFn()\`.
`

function changedFile(filename: string, patch = ''): ChangedFile {
  return { filename, status: 'modified', patch }
}

describe('buildPrompt', () => {
  it('includes current content in user message', () => {
    const { user } = buildPrompt(README, 'README.md', [changedFile('src/index.ts')], new Map())
    expect(user).toContain('# My Project')
  })

  it('includes diff section', () => {
    const file = changedFile('src/index.ts', '@@ -1,3 +1,4 @@\n+export function newFn() {}')
    const { user } = buildPrompt(README, 'README.md', [file], new Map())
    expect(user).toContain('newFn')
  })

  it('includes file contents when provided', () => {
    const contents = new Map([['src/index.ts', 'export function myFn() {}']])
    const { user } = buildPrompt(README, 'README.md', [changedFile('src/index.ts')], contents)
    expect(user).toContain('export function myFn')
  })

  it('uses correct system prompt', () => {
    const { system } = buildPrompt(README, 'README.md', [], new Map())
    expect(system).toBe(SYSTEM_PROMPT)
    expect(system).toContain('<updated_content>')
    expect(system).toContain('DOCPILOT_SUMMARY')
  })

  it('handles empty file contents gracefully', () => {
    const { user } = buildPrompt(README, 'README.md', [], new Map())
    expect(user).toContain('## Current README.md')
    expect(user).not.toContain('## Changed File Contents')
  })

  it('does not exceed context budget with many files', () => {
    const contents = new Map<string, string>()
    for (let i = 0; i < 50; i++) {
      contents.set(`src/file${i}.ts`, 'x'.repeat(10000))
    }
    const { user } = buildPrompt(README, 'README.md', [], contents)
    // Rough check: should not be absurdly large
    expect(user.length).toBeLessThan(150_000 * 4)
  })
})
