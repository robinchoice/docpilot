import { describe, it, expect } from 'vitest'
import { filterFiles } from '../src/filter.js'
import type { ChangedFile } from '../src/types.js'

function file(filename: string, content = 'x'.repeat(100)): ChangedFile {
  return { filename, status: 'modified', patch: '', content }
}

describe('filterFiles', () => {
  const defaults = [
    '*.lock', '*.lockb', 'package-lock.json',
    'dist/**', 'node_modules/**',
    '*.png', '*.jpg', '*.svg',
  ]

  it('keeps normal source files', () => {
    const result = filterFiles([file('src/index.ts')], defaults, 51200)
    expect(result).toHaveLength(1)
  })

  it('removes lock files', () => {
    const result = filterFiles([
      file('bun.lock'),
      file('package-lock.json'),
      file('yarn.lock'),
    ], defaults, 51200)
    expect(result).toHaveLength(0)
  })

  it('removes binary files by extension', () => {
    const result = filterFiles([
      file('logo.png'),
      file('icon.svg'),
      file('photo.jpg'),
    ], defaults, 51200)
    expect(result).toHaveLength(0)
  })

  it('removes files in dist/', () => {
    const result = filterFiles([file('dist/index.js')], defaults, 51200)
    expect(result).toHaveLength(0)
  })

  it('removes files exceeding maxFileSize', () => {
    const big = file('large.ts', 'x'.repeat(60000))
    const result = filterFiles([big], defaults, 51200)
    expect(result).toHaveLength(0)
  })

  it('keeps files within maxFileSize', () => {
    const small = file('small.ts', 'x'.repeat(100))
    const result = filterFiles([small], defaults, 51200)
    expect(result).toHaveLength(1)
  })

  it('respects custom exclude patterns', () => {
    const result = filterFiles([file('src/generated.ts')], ['src/generated*'], 51200)
    expect(result).toHaveLength(0)
  })
})
