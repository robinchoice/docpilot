# docpilot

[![CI](https://github.com/robinchoice/docpilot/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/robinchoice/docpilot/actions/workflows/ci.yml)

Auto-update your README when code changes, powered by any OpenAI-compatible LLM.

On every push, docpilot analyzes the diff, sends the changed files and current README to the LLM of your choice, and opens a PR with the updated documentation. You review and merge the proposed changes.

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
| `model` | no | `anthropic/claude-haiku-4.5` | Model ID (provider-specific) |
| `target-file` | no | `README.md` | File to keep up-to-date |
| `github-token` | no | `${{ github.token }}` | Token for creating PRs |
| `exclude-patterns` | no | lock files, binaries, dist | Comma-separated glob patterns to ignore |
| `pr-labels` | no | `documentation,automated` | Labels to add to the PR |
| `pr-reviewers` | no | — | GitHub usernames to request review from |
| `max-file-size` | no | `51200` | Threshold for truncating changed-file content (currently measured in characters; see limits below) |

## Provider examples

```yaml
# OpenRouter (default — access to all major models)
api-key: ${{ secrets.OPENROUTER_API_KEY }}
model: anthropic/claude-haiku-4.5

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

# Self-hosted (vLLM)
api-key: ${{ secrets.VLLM_API_KEY }}
api-base-url: http://your-server:8000/v1
model: my-docs-model
```

For vLLM, set `model` to the model ID or alias served by your instance and use its configured API key. The base URL includes `/v1`, not `/chat/completions`: [the client](src/llm.ts) appends that route. The server must support chat messages with a system role and an output allowance of `8192` tokens, as sent by docpilot. vLLM requires a model with a chat template; see its [OpenAI-compatible server documentation](https://docs.vllm.ai/en/stable/serving/online_serving/openai_compatible_server/).

The Actions runner must be able to reach the endpoint. For a private inference server, use a self-hosted runner on that network (`runs-on: self-hosted` in the usage example). `localhost` refers to the runner itself. The README, filtered diff and included source contents go to the selected endpoint; docpilot runs no inference server of its own.

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

## Design and limits

### Selecting context for large changes

[Filtering](src/filter.ts) excludes known binary extensions and the configured glob patterns before either patches or file contents enter the prompt. The defaults exclude lock files, build output and dependencies. Binary detection uses extensions, not content inspection; these filters are not a secret scanner. The target documentation file is excluded from the change set to avoid triggering updates from documentation-only pushes.

[Context gathering](src/context.ts) reads the existing target file and the current contents of changed, non-deleted files. Deleted files can still contribute their patches. Symlink files and paths resolving outside the workspace are not read. There is no repository-wide retrieval or dependency traversal.

Large changes have two stages of context reduction:

- `max-file-size` defaults to `51200`. Despite the input's byte-based description in `action.yml`, the implementation compares JavaScript string length (UTF-16 code units). Above that threshold, it includes the first 200 lines plus a truncation marker. This is a trigger for truncation, not a hard size cap: long lines can still exceed it. The current README and diff patches are not subject to this threshold.
- [Prompt assembly](src/prompt.ts) uses a fixed estimate of 150,000 tokens at four characters per token, subtracting the system prompt, current documentation and diff before adding file contents. Files mentioned in other patches take priority, followed by common entry points and manifests. When space runs out, one file may be truncated and the remaining files omitted. The current documentation and diff are retained even if they already exceed the estimate.

This is a character-based heuristic, not model-aware token accounting. There is no diff chunking, context-window discovery or automatic retry with a smaller prompt. Large diffs can exceed the provider's context window; models with smaller context windows may reach that limit much sooner. Exclude irrelevant paths or split large pushes, and allow room for the requested `8192` output tokens.

### Constraining generation and keeping review in the loop

The [system prompt](src/prompt.ts) instructs the model to change only sections directly affected by the supplied evidence, leave uncertain sections unchanged, preserve structure and return unaffected text verbatim. These instructions reduce unsupported edits; they cannot guarantee factual correctness or prevent prompt injection from repository content.

[Response parsing](src/llm.ts) requires `<updated_content>` tags and extracts a short summary. It does not validate claims against code. The model returns the entire document in one response, with a fixed `8192`-token output limit. Long documents can therefore be cut off; there is no continuation mechanism or explicit rejection based on the API's finish reason. [The action](src/main.ts) warns when the document length changes by more than 60% of the longer version, but the warning does not block a PR.

That is why generated edits go through [a dedicated branch and PR](src/pr.ts), rather than a direct commit to the source branch: a reviewer can inspect the exact documentation diff before merging. An existing open docpilot PR for the target file is updated instead of opening another. Review remains the correctness boundary; docpilot neither approves nor merges its own PRs.

### Deliberate scope

docpilot updates one existing documentation file per invocation. It skips a missing or empty target and does not bootstrap documentation, coordinate edits across multiple documents, execute code to verify claims or provide an autonomous tool-using agent. The LLM interface uses OpenAI-compatible Chat Completions without tool calls; provider-specific serving, retrieval and orchestration stay outside the action.

[CI](https://github.com/robinchoice/docpilot/actions/workflows/ci.yml) runs unit tests, type checking and a rebuild check against the committed action bundle. The [dogfood workflow](.github/workflows/dogfood.yml) is configured to run docpilot against this repository, but skips generation when `OPENROUTER_API_KEY` is absent. These checks cover implementation behavior, not the factual quality of generated documentation.

## License

MIT
