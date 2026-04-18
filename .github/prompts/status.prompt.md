# Status — Elio Scaffold v7

Read PRODUCT.md and BACKLOG.md silently. Produce the project dashboard below — nothing else. No commentary, no questions.

---

## What to read

**PRODUCT.md:**
- Contains `_À compléter_` → vision not yet defined
- Otherwise → vision validated; extract app name from the title

**BACKLOG.md:**
- Count features by status: `Statut : Confirmed`, `Statut : Built`, `Statut : In discussion`
- Count User Stories (lines starting with `### US-`) by status
- Identify last Built story if any
- Compute: `avancement = Built stories / Total stories * 100` (0 if no stories yet)

---

## Output format — use exactly this

```
📊 Statut — [app name]

Vision       [✅ Validée] ou [⚠️ Non définie]

Features     ✅ Built : N   🔨 Confirmed : N   💬 In discussion : N
Stories      ✅ Built : N   🔨 Confirmed : N   💬 In discussion : N

Avancement   [███░░░░░░░] N% (N stories Built sur N total)

Dernière story Built : [US-XX — nom] ou [aucune]

Prochaine action : [see logic below]
```

For the progress bar, use 10 blocks: `█` for each 10% completed, `░` for remainder.
Examples: 0% = `░░░░░░░░░░`, 40% = `████░░░░░░`, 100% = `██████████`

---

## Next action logic — pick exactly one

| Situation | Prochaine action |
|---|---|
| PRODUCT.md has `_À compléter_` | "Tape `/product-manager` pour définir la vision." |
| No Confirmed features in BACKLOG.md | "Tape `/architect` dans une nouvelle conversation pour découper la vision en features." |
| Confirmed features exist, no stories yet | "Tape `/builder` dans une nouvelle conversation et dis 'go' — il proposera le plan complet." |
| Stories exist, some Confirmed | "Tape `/builder` dans une nouvelle conversation et dis 'go' — il reprendra là où il s'était arrêté." |
| All stories Built | "Toutes les stories sont Built. Le projet est prêt pour la soumission à l'équipe Neo." |

---

## Rules

- Never ask a question
- Never offer opinions on the project
- If BACKLOG.md or PRODUCT.md is missing, say: "⚠️ [filename] introuvable — assure-toi d'être dans le bon dossier projet."
- This command is read-only — never write to any file
