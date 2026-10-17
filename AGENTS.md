# docpilot

## Purpose & links

- GitHub Action that updates a README from the code diff with any OpenAI-compatible LLM and opens a PR with the change. Public: `robinchoice/docpilot`.
- Not deployed anywhere. Users reference the action by tag.

## Checks

`bun install && bun test && bunx tsc --noEmit`, plus `bun run build` whenever `src/` changed.

## Deploy

- Every branch/tag push and fork PR runs `secrets.yml` (gitleaks with `--redact`, rules in `.gitleaks.toml`; fork PRs use the base commit's config and ignore file). New branches with no commits beyond the default branch are skipped. A push to `main` also runs `ci.yml` and `dogfood.yml`. Dogfood runs the action from this checkout against its own README and opens a PR if the docs drifted.
- Without the repo secret `OPENROUTER_API_KEY`, dogfood logs a notice and skips the run. The secret is deliberately not set to avoid running costs.
- Verify: `gh run watch`.

## Pitfalls

- The action runs `dist/index.js`, which is committed. After changing `src/`, rebuild with `bun run build` and commit `dist/` in the same commit, otherwise users and dogfood run the old code.
- The README tells users to use `robinchoice/docpilot@v1`, but no version tag is published yet. Publishing one is a release and needs Robin's go.
- The repo and its CI logs are public. `.gitleaks.toml` skips only `generic-api-key` in `dist/` (bundled third-party code). Handle other false positives by fingerprint in `.gitleaksignore`, never disable a rule. A real finding is already public: rotate the secret.
