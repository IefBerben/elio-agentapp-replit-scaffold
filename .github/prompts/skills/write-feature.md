# Skill: write-feature

## Inputs
- `feature_n` — feature number
- `feature_name` — feature name in French
- `business_value` — one sentence from PRODUCT.md explaining the value
- `success_criterion` — what the PO will observe when the feature is done (plain French, no jargon)

## Process

Write the feature block directly into BACKLOG.md.
If BACKLOG.md is empty or has no features yet, create the structure.
If features already exist, append after the last one.

Never write User Stories, SSE contracts, or file lists — those are added by the builder.

## Output

Write exactly this format into BACKLOG.md:

```markdown
## Feature {feature_n} — {feature_name}
**Statut :** Confirmed

**Valeur métier :** {business_value}
**Critère de succès :** {success_criterion}
```
