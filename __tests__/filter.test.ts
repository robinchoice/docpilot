import { describe, it, expect } from 'vitest'
import { filterFiles } from '../src/filter.js'
import type { ChangedFile } from '../src/types.js'

function file(filename: string): ChangedFile {
  return { filename, status: 'modified', patch: '' }
}

describe('filterFiles', () => {
  const defaults = [
    '*.lock', '*.lockb', 'package-lock.json',
    'dist/**', 'node_modules/**',
    '*.png', '*.jpg', '*.svg',
  ]

  it('keeps normal source files', () => {
    const result = filterFiles([file('src/index.ts')], defaults)
    expect(result).toHaveLength(1)
  })

  it('removes lock files', () => {
    const result = filterFiles([
      file('bun.lock'),
      file('package-lock.json'),
      file('yarn.lock'),
    ], defaults)
    expect(result).toHaveLength(0)
  })

  it('removes binary files by extension', () => {
    const result = filterFiles([
      file('logo.png'),
      file('icon.svg'),
      file('photo.jpg'),
    ], defaults)
    expect(result).toHaveLength(0)
  })

  it('removes files in dist/', () => {
    const result = filterFiles([file('dist/index.js')], defaults)
    expect(result).toHaveLength(0)
  })

  it('respects custom exclude patterns', () => {
    const result = filterFiles([file('src/generated.ts')], ['src/generated*'])
    expect(result).toHaveLength(0)
  })
})
