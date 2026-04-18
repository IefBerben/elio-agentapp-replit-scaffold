# Getting Started — Elio Scaffold v8

Build your first agent app in 5 steps.

---

## What you need

| | |
|---|---|
| **Replit account** | [replit.com](https://replit.com) |
| **Azure OpenAI credentials** | Endpoint + API key — ask your tech lead |

---

## Step 1 — Fork this project

On the GitHub page → click **"Use this template"** → **"Create a new repository"**.
Then on Replit → **Import code or design** → **From GitHub** → paste your repo URL.

> Or open this project on Replit directly and click **Fork**.

---

## Step 2 — Set your credentials

In Replit, open the **Secrets** panel (padlock icon in the left sidebar) and add:

| Key | Value |
|-----|-------|
| `AZURE_OPENAI_ENDPOINT` | `https://your-resource.cognitiveservices.azure.com/` |
| `AZURE_OPENAI_API_KEY` | your API key |
| `AZURE_OPENAI_DEPLOYMENT` | your deployment name (e.g. `gpt-4.1`) |
| `AZURE_OPENAI_API_VERSION` | `2025-01-01-preview` |

---

## Step 3 — Click Run ▶

Replit installs all dependencies and starts both servers automatically:
- **Backend** — FastAPI on port 8000
- **Frontend** — React on port 5173 (visible in the **Webview** tab)

First run takes ~2 minutes. Subsequent runs are fast.

---

## Step 4 — Try the live demo

Open the **Webview** tab. You'll see a working agent app — type a question, click Generate, and watch it stream a response from Azure OpenAI. This is the reference pattern your agents will follow.

---

## Step 5 — Build your agent

Open the **Replit AI** chat (✨ icon in the sidebar).

Attach a prompt file from `.github/prompts/` and start the conversation:

| What you want to do | Attach this file |
|---------------------|------------------|
| Define your app idea | `product-manager.prompt.md` |
| Design the features | `architect.prompt.md` |
| Build the features | `builder.prompt.md` |
| Check build quality | `quality.prompt.md` |
| See project status | `status.prompt.md` |

Start with: *"Je veux créer un agent pour [ton idée]"*

---

## Project structure

```
back/          Python FastAPI backend — your agents live here
  agents/
    _reference/    Working example — read this, don't modify it
    your_agent/    Copy _reference/ and rename for your use case
  services/        LLM config, file processing, document generation

front/         React + TypeScript frontend
  src/
    pages/         One page per agent app
    components/    Shared design system components (AgentApp*)
    stores/        Zustand state — one store per agent app
```

---

## Key rules (important!)

1. **Never call the LLM directly** — always `from services.llm_config import get_llm`
2. **Never use `useState` for results** — use Zustand stores in `src/stores/agent-apps/`
3. **Never modify `back/agents/_reference/`** — it's a protected reference
4. **Every color needs dark mode pair** — `bg-blue-100 dark:bg-blue-900/30`
5. **Every step function needs `@stream_safe`** decorator

---

## Need help?

Read [`VIBE-CODING-GUIDE.md`](VIBE-CODING-GUIDE.md) for the full workflow guide.
