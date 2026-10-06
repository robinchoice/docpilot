import { describe, it, expect } from 'vitest'
import { parseResponse } from '../src/llm.js'

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
    const result = parseResponse(VALID_RESPONSE)
    expect(result.updatedContent).toContain('# My Project')
    expect(result.updatedContent).toContain('newFn()')
  })

  it('extracts summary from valid response', () => {
    expect(parseResponse(VALID_RESPONSE).summary).toContain('newFn()')
  })

  it('detects missing tags in invalid response', () => {
    expect(() => parseResponse(INVALID_RESPONSE)).toThrow('did not contain <updated_content> tags')
  })
})
