# docpilot — Die Idee

## Das Problem

Dokumentation lügt.

Nicht absichtlich — aber sie driftet. Eine Funktion wird umbenannt, ein Endpoint verschwindet, ein Setup-Schritt ändert sich. Die Docs bleiben stehen. Wer sie liest, glaubt ihnen. Wer den Code kennt, traut ihnen nicht.

Das Ergebnis: Teams schreiben keine Docs, weil sie wissen dass sie veralten. Oder sie schreiben sie, und aktualisieren sie nie. Beides endet am selben Ort: niemand liest die Docs mehr.

Das ist kein Disziplin-Problem. Es ist ein Workflow-Problem.

---

## Die Lösung

**docpilot** koppelt Dokumentation an den Git-Workflow.

Jedes Mal wenn Code gepusht wird, analysiert docpilot was sich geändert hat — und aktualisiert die betroffenen Teile der Dokumentation. Nicht alles. Nur das, was sich wirklich verändert hat.

```
git push
  → GitHub Action startet
  → Diff: welche Dateien haben sich geändert?
  → Claude liest Code-Kontext + Diff
  → Generiert / aktualisiert betroffene Docs-Abschnitte
  → Öffnet PR zur Freigabe
  → Dev mergt — fertig
```

Docs driften nicht mehr, weil sie nicht von Menschen gepflegt werden müssen. Sie folgen dem Code — automatisch.

---

## Wer es braucht

**Solo-Devs und kleine Teams (2–5 Personen)**
Kein Budget für einen Tech-Writer. Kein Bandwidth um Docs nach jedem Sprint manuell upzudaten. Docpilot übernimmt das.

**Open-Source-Projekte**
Maintainer wollen gute Docs, haben aber keine Zeit. Contributor frustriert weil die README veraltet ist. Docpilot macht gute Docs zu einem kostenlosen Nebenprodukt jedes Commits.

**Agenturen**
Kunden-Repos übergeben, Docs fehlen oder sind falsch. Docpilot generiert Übergabe-Dokumentation automatisch aus dem Ist-Zustand des Codes.

---

## Release-Strategie

### v1 — README-Modus

Fokus auf eine Datei: die `README.md`.

Die README ist das erste was jeder sieht. Sie driftet am meisten, weil sie am meisten gelesen aber am seltensten aktualisiert wird.

docpilot v1 hält die README aktuell:
- Erkennt Änderungen an Setup-relevanten Dateien (`package.json`, `Dockerfile`, Config-Files, Einstiegspunkte)
- Aktualisiert betroffene Abschnitte (Installation, Usage, Features, Environment Variables)
- Öffnet PR — kein direkter Commit in main. Dev behält Kontrolle.

Kleiner Scope. Sofort nützlich. Einfach zu testen.

### v2 — Full-Docs-Modus

Komplette Dokumentation aus dem Code:
- API-Referenz (Endpoints, Parameter, Response-Schemas)
- Architecture-Übersicht (welche Module tun was)
- Guides (Setup, Deployment, Contributing)

Für Teams die mehr als eine README brauchen.

---

## Was docpilot nicht ist

- Kein Ersatz für menschliche Entscheidungen über Architektur oder Konzepte
- Keine magische Lösung für schlecht strukturierten Code
- Kein Rechtschreib-Korrektor oder Style-Guide-Enforcer

docpilot schreibt was da ist — nicht was sein sollte.

---

## Tech

- **Trigger:** GitHub Actions (v1), GitLab CI + Gitea geplant (v2)
- **AI:** Claude API — Haiku für einfache Diffs, Sonnet für komplexe Kontexte
- **Output:** Markdown-PR direkt ins Repo
- **Deployment:** GitHub Action (Marketplace), selbst-hostbar

---

## Verbindung zu Perpetual Traveler

PT-Gesetze ändern sich laufend. Digital Nomad Visa kommen und gehen. Steuerregeln werden renegoziert. Eine manuelle Wissensbasis veraltet in Wochen.

docpilot ist die Infrastruktur, die das PT-Wissensprodukt aktuell hält — automatisch. PT wird zum ersten echten Anwendungsfall und Referenz-Case für docpilot.

---

## Offene Fragen

- **Open Source oder kommerziell?** FOSS-Tool mit optionalem Hosted-Service (wie Plausible)?
- **GitHub-only oder multi-VCS?** v1 GitHub-only, v2 erweitern
- **Docs im selben Repo oder separates Docs-Repo?** Beides unterstützen
- **Preis-Modell:** Free für Open-Source-Repos, paid für private Repos?
