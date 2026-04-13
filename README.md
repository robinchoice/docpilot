# docpilot

Auto-update your README when code changes, powered by any OpenAI-compatible LLM.

On every push, docpilot analyzes the diff, sends the changed files and current README to the LLM of your choice, and opens a PR with the updated documentation. You review and merge — docs never drift.

## Usage

```yaml
# .github/workflows/docs.yml
name: Update docs

on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: robinchoice/docpilot@v1
        with:
          api-key: ${{ secrets.OPENROUTER_API_KEY }}
```

## Configuration

| Input | Required | Default | Description |
|---|---|---|---|
| `api-key` | yes | — | API key for your LLM provider |
| `api-base-url` | no | `https://openrouter.ai/api/v1` | OpenAI-compatible API endpoint |
| `model` | no | `anthropic/claude-haiku-4-5-20251001` | Model ID (provider-specific) |
| `target-file` | no | `README.md` | File to keep up-to-date |
| `github-token` | no | `${{ github.token }}` | Token for creating PRs |
| `exclude-patterns` | no | lock files, binaries, dist | Comma-separated glob patterns to ignore |
| `pr-labels` | no | `documentation,automated` | Labels to add to the PR |
| `pr-reviewers` | no | — | GitHub usernames to request review from |
| `max-file-size` | no | `51200` | Max file size in bytes to include in context |

## Provider examples

```yaml
# OpenRouter (default — access to all major models)
api-key: ${{ secrets.OPENROUTER_API_KEY }}
model: anthropic/claude-haiku-4-5-20251001

# OpenAI
api-key: ${{ secrets.OPENAI_API_KEY }}
api-base-url: https://api.openai.com/v1
model: gpt-4o-mini

# Anthropic
api-key: ${{ secrets.ANTHROPIC_API_KEY }}
api-base-url: https://api.anthropic.com/v1
model: claude-haiku-4-5-20251001

# Self-hosted (Ollama)
api-key: unused
api-base-url: http://your-server:11434/v1
model: llama3
```

## Outputs

| Output | Description |
|---|---|
| `updated` | `"true"` if a PR was created, `"false"` otherwise |
| `pr-url` | URL of the created PR (empty if no changes needed) |

## How it works

1. Gets the git diff for the push
2. Filters out lock files, binaries, and other irrelevant files
3. Reads the current README and the changed source files
4. Sends everything to the LLM with strict instructions: only update affected sections, never invent information, preserve existing structure
5. If the README changed, opens a PR — never commits directly to your main branch

## License

MIT
