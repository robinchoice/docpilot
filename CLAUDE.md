# docpilot — Claude-Kontext

## Was dieses Projekt ist

**docpilot** ist ein Tool das Dokumentation automatisch aktuell hält — gekoppelt an den Git-Workflow. Bei jedem Push wird der Code-Diff analysiert und die betroffenen Docs-Abschnitte werden per Claude API aktualisiert. Der Dev bekommt einen PR zur Freigabe.

**Kernidee:** Docs driften nicht mehr, weil sie dem Code folgen — nicht umgekehrt.

## Aktueller Stand

Ring 1 beruflich — eigenes Repo, promoted aus robin-work am 2026-04-13.
Status: Konzeptphase. Noch kein Code.

Lies `00-status.md` und `01-idee.md` für den vollständigen Kontext.

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
