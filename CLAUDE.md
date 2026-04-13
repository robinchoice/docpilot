# docpilot — Claude-Kontext

## Was dieses Projekt ist

**docpilot** ist ein Tool das Dokumentation automatisch aktuell hält — gekoppelt an den Git-Workflow. Bei jedem Push wird der Code-Diff analysiert und die betroffenen Docs-Abschnitte werden per Claude API aktualisiert. Der Dev bekommt einen PR zur Freigabe.

**Kernidee:** Docs driften nicht mehr, weil sie dem Code folgen — nicht umgekehrt.

## Aktueller Stand

<!-- Zuletzt aktualisiert: 2026-04-13 via /save -->

**Sprint / Phase:** v1 MVP — vollständig implementiert, bereit für ersten echten Einsatz

**Zuletzt implementiert:**
- Vollständige GitHub Action in TypeScript: `src/` mit 9 Modulen (diff, filter, context, prompt, llm, pr, inputs, types, main)
- Provider-agnostisch via `openai` npm Package — OpenRouter default, OpenAI/Anthropic/Ollama konfigurierbar
- `dist/index.js` gebundelt (ncc), 16 Unit Tests grün, TypeScript fehlerfrei
- Workflows: CI (`ci.yml`) + Dogfood (`dogfood.yml`)

**Als nächstes:**
- `OPENROUTER_API_KEY` als GitHub Secret hinterlegen → Dogfood aktivieren
- `dist/` Commit-Strategie klären (für Release-Tags aus `.gitignore` rausnehmen)
- Release-Workflow anlegen (ncc build → Tag v1 → GitHub Marketplace)

**Offene Punkte:**
- LLM-Beschreibung in CLAUDE.md noch "Claude API" — sollte auf "OpenAI-kompatibel / OpenRouter" aktualisiert werden

## Geplante Architektur

```
git push
  → GitHub Action
  → Diff analysieren (welche Dateien geändert?)
  → Claude API: Code-Kontext + Diff
  → Docs-Abschnitte aktualisieren
  → PR öffnen (nie direkt in main committen)
```

## Release-Strategie

- **v1:** README-Modus — nur README.md aktuell halten, PR-Flow
- **v2:** Full-Docs — API-Referenz, Architecture, Guides

## Tech-Stack (geplant)

- Trigger: GitHub Actions
- Sprache: TypeScript oder Python
- AI: Claude API (Haiku/Sonnet)
- Output: Markdown-PR ins Repo

## Ring-Kontext

Ring 1 beruflich. Öffentliches GitHub-Repo: github.com/robinchoice/docpilot.
FOSS-Ausrichtung — Open Source mit optionalem Hosted-Service (Plausible-Modell).
