# docpilot — Status

**Erstellt:** 2026-04-13
**Ring:** 1 beruflich (Ring-2-Projekt in robin-work, Promotion wenn Repo gerechtfertigt)
**Status:** Idee → Konzeptphase

## Was es ist

Ein Tool das automatisch Code-Änderungen auf Git scannt und darauf basierend die Dokumentation schreibt und aktuell hält. Docs driften nie — weil sie beim Push neu generiert werden.

**Kernidee:**
```
git push → CI triggert → Diff analysieren →
Claude API: Code-Kontext + Diff → Docs generieren/aktualisieren →
Commit zurück ins Repo oder Docs-Site updaten
```

## Warum

- Keine bestehende Lösung macht das vollständig (Swimm: kein Auto-Write · Mintlify: nur API-Docs · Sphinx: braucht manuelle Kommentare)
- Echte Marktlücke für kleinere Teams ohne Tech-Writer
- LLMs (Claude) sind gut genug um sinnvolle Docs aus Code zu generieren

## Zielgruppe (erste Hypothese)

- Solo-Devs und kleine Teams (2–5 Personen)
- Open-Source-Projekte die Docs wollen aber keine Zeit haben
- Agenturen die Kunden-Repos dokumentieren müssen

## Kernprobleme zu lösen

1. **Mapping:** Welche Docs-Abschnitte gehören zu welchen Code-Dateien?
2. **Partial Update:** Nur die betroffenen Abschnitte updaten, nicht alles überschreiben
3. **Halluzinationen vermeiden:** Claude muss echten Code sehen, nicht raten
4. **Format-Konsistenz:** Docs-Struktur über Zeit stabil halten

## Tech-Stack (Hypothese)

- **Trigger:** GitHub Actions (oder GitLab CI, Gitea)
- **Sprache:** TypeScript oder Python
- **AI:** Claude API (Haiku für Kosten, Sonnet für Qualität)
- **Output:** Markdown-Dateien im Repo oder separate Docs-Site (Mintlify, Docusaurus)
- **Deployment:** GitHub Action als Marketplace-Action, oder selbst-hostbar

## Release-Strategie

**v1 — README-Modus (MVP)**
Nur die README aktuell halten. Kleiner Scope, sofort nützlich, einfach zu testen.
- Erkennt welche Dateien sich geändert haben
- Aktualisiert betroffene README-Abschnitte (Setup, Usage, Features)
- Öffnet einen PR — kein direkter Commit in main (Kontrolle bleibt beim Dev)

**v2 — Full-Docs-Modus**
Komplette Dokumentation: API-Referenz, Architecture-Übersicht, Guides.
Für komplexere Projekte und Teams.

## Nächste Schritte

- [ ] Marktrecherche: was machen Swimm, Mintlify, Stenography genau?
- [ ] Technisches Proof-of-Concept: GitHub Action → Diff → Claude → Markdown-Update
- [ ] Zielgruppe schärfen: Open-Source-Tool oder SaaS?
- [ ] Name final: docpilot / livdoc / driftless?

## Offene Fragen

- Open Source oder kommerziell? (Ring 3 vs. monetarisiert)
- GitHub-only oder multi-VCS (GitLab, Gitea, Forgejo)?
- Docs im selben Repo oder separates Docs-Repo?
