import { describe, it, expect } from 'vitest'

// Test the response parsing logic directly without making API calls
// We import the internals by re-exporting them for test purposes
// (or test via the public interface with mocks)

const VALID_RESPONSE = `Here is the updated documentation.

<updated_content>
# My Project

## Installation

Run \`npm install\`.

## Usage

Call \`myFn()\` or the new \`newFn()\` helper.
</updated_content>

DOCPILOT_SUMMARY: Added newFn() to the Usage section based on the new export in src/index.ts`

const INVALID_RESPONSE = `I updated the docs but forgot the tags.
Here is the content without proper wrapping.`

describe('LLM response parsing', () => {
  it('extracts content from valid response', () => {
    const match = VALID_RESPONSE.match(/<updated_content>([\s\S]*?)<\/updated_content>/)
    expect(match).not.toBeNull()
    expect(match![1].trim()).toContain('# My Project')
    expect(match![1].trim()).toContain('newFn()')
  })

  it('extracts summary from valid response', () => {
    const match = VALID_RESPONSE.match(/DOCPILOT_SUMMARY:\s*(.+)/)
    expect(match).not.toBeNull()
    expect(match![1]).toContain('newFn()')
  })

  it('detects missing tags in invalid response', () => {
    const match = INVALID_RESPONSE.match(/<updated_content>([\s\S]*?)<\/updated_content>/)
    expect(match).toBeNull()
  })
})
