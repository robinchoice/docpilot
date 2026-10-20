import { describe, it, expect } from 'bun:test'
import { parseGitDiff } from '../src/diff.js'

function patch(oldName: string, newName = oldName): string {
  return [
    `diff --git a/${oldName} b/${newName}`,
    'index 1111111..2222222 100644',
    `--- a/${oldName}`,
    `+++ b/${newName}`,
    '@@ -1 +1 @@',
    '-old',
    '+new',
  ].join('\n')
}

describe('parseGitDiff', () => {
  it('maps name-status letters to statuses', () => {
    const files = parseGitDiff('A\tnew.ts\nM\tsrc/index.ts\nD\tgone.ts\nR100\told.ts\tmoved.ts\n', '')
    expect(files.map(f => [f.filename, f.status])).toEqual([
      ['new.ts', 'added'],
      ['src/index.ts', 'modified'],
      ['gone.ts', 'removed'],
      ['moved.ts', 'renamed'],
    ])
  })

  it('attaches each file its own patch', () => {
    const diff = patch('a.ts') + '\n' + patch('b.ts') + '\n'
    const files = parseGitDiff('M\ta.ts\nM\tb.ts\n', diff)
    expect(files[0].patch).toContain('diff --git a/a.ts b/a.ts')
    expect(files[0].patch).not.toContain('b/b.ts')
    expect(files[1].patch).toContain('diff --git a/b.ts b/b.ts')
  })

  it('attaches a rename patch to the new name', () => {
    const files = parseGitDiff('R100\told.ts\tmoved.ts\n', patch('old.ts', 'moved.ts'))
    expect(files[0].patch).toContain('+++ b/moved.ts')
  })

  it('handles paths with spaces and " b/" inside', () => {
    const diff = patch('c.txt') + '\n' + patch('a b/c.txt')
    const files = parseGitDiff('M\tc.txt\nM\ta b/c.txt\n', diff)
    expect(files.find(f => f.filename === 'c.txt')?.patch).toContain('+++ b/c.txt\n')
    expect(files.find(f => f.filename === 'a b/c.txt')?.patch).toContain('+++ b/a b/c.txt')
  })

  it('handles non-ASCII paths as git prints them with quotepath off', () => {
    const files = parseGitDiff('M\tdocs/über.md\n', patch('docs/über.md'))
    expect(files[0].patch).toContain('+++ b/docs/über.md')
  })

  it('leaves the patch empty for a file without a diff header', () => {
    const files = parseGitDiff('M\tonly-in-status.ts\n', '')
    expect(files[0].patch).toBe('')
  })
})
