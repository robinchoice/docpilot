export interface ActionInputs {
  apiKey: string
  apiBaseUrl: string
  model: string
  targetFile: string
  githubToken: string
  excludePatterns: string[]
  prLabels: string[]
  prReviewers: string[]
  maxFileSize: number
}

export interface ChangedFile {
  filename: string
  status: 'added' | 'modified' | 'removed' | 'renamed'
  patch: string
  content?: string
}

export interface UpdateResult {
  updatedContent: string
  summary: string
  sectionsChanged: string[]
}
