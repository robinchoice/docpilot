# docpilot

## Purpose & links

- GitHub Action that updates a README from the code diff with any OpenAI-compatible LLM and opens a PR with the change. Public: `robinchoice/docpilot`.
- Not deployed anywhere. Users reference the action by tag.

## Checks

`bun install && bun test && bunx tsc --noEmit`, plus `bun run build` whenever `src/` changed.

## Deploy

- A push to `main` runs `ci.yml` and `dogfood.yml`. Dogfood runs the action from this checkout against its own README and opens a PR if the docs drifted.
- Verify: `gh run watch`.

## Pitfalls

- The action runs `dist/index.js`, which is committed. After changing `src/`, rebuild with `bun run build` and commit `dist/` in the same commit, otherwise users and dogfood run the old code.
- The README tells users to use `robinchoice/docpilot@v1`, but no version tag is published yet. Publishing one is a release and needs Robin's go.
