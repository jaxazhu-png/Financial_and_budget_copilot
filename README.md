# Financial & Budgeting Copilot (AI_SS_02) — Interactive Demo

An interactive, runnable demo of the **Financial & Budgeting Copilot** for the Ministry of
Municipalities and Housing (MoMRAH) / **Agency for Financial Affairs and Budget**. It presents
**one multi-agent platform** with connected, agentic journeys — all driven by the Orchestrator
Agent. Visual style follows the **Balady / MoMRAH design system** (Saudi green, RTL-first), matching
the sibling `demo-DSO`.

## Journeys (reachable in one session)

- **Conversational Analysis** — ask in natural language → the Orchestrator interprets intent,
  **routes across agents**, and returns a source-backed, confidence-scored answer. Includes an
  **escalation guard** (sensitive / over-permission questions are declined, not answered).
- **Performance Analysis · UC-06** — the Financial Performance Analysis Department report builder,
  in four steps: **1 Operational Parameters** (6 filters) → **2 Generate Dashboard** (AI reasoning →
  scope summary, AI brief, 7 KPI cards, regional performance map, spending chart, budget-door flow,
  service progress, Vision Programs table) → **3 Review Commentary** (slide list + editable narrative
  cards with AI confidence + chart + AI co-pilot, report-type selector) → **4 Report Detail** (slide-deck
  viewer, Submit for Review / Export).
- **Monitoring & Early Warning** (`UC-02`) — Data Quality + Deviation agents scan 11 sources;
  run a scan to refresh source health; each alert carries root cause and an **"Ask Orchestrator"**
  button that hands off into the chat.
- **Budget Execution · G-03** (`UC-01→02→07→08→10`) — deviation scan → fiscal-space recompute →
  **AI reallocation recommendation → human approval** → narrative report.
- **Claims & Disbursement · G-04** (`UC-01→02→11→08→10`) — duplicate-invoice detection → IPSAS
  compliance → **AI disbursement recommendation → human approval** → disbursement summary.

Three BRD principles are visible throughout: **human-in-the-loop** (every AI output is a draft
until approved), **explainability** (confidence + sources + reasoning on each recommendation),
and **traceability** (data-lineage popovers + a live agent-activity log).

## Features

- **Login** — Balady / MoMRAH Single-Sign-On style page with a **role selector**.
- **Roles** — Financial Data Analyst (full walkthrough), Budget Execution Manager, Senior
  Leadership — each gets a different navigation set.
- **Trilingual** — Arabic (RTL) · English · 中文. Toggle in the top bar/login, **or deep-link a
  language** with `?ln=zh` (also `?ln=en`, `?ln=ar`) — e.g. `standalone.html?ln=zh` opens in Chinese.
- **Scope** switch (Consolidated / Ministry HQ / Amanas) in the top bar, reflected on reports.
- A live **Agent Activity** log strip along the bottom.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → /dist
npm run standalone # regenerates standalone.html (double-click build)
```

To preview **without a build**, double-click `standalone.html` (keep the `assets/` folder next to
it; React/Recharts load from a CDN, so the first open needs internet).

## GitHub + Vercel (auto-deploy)

Repo: **https://github.com/liucheng77/MOMAH-finbudcop**
Vercel project: **https://vercel.com/momah-projects/momah-finbudcop**

Deployment is handled by **Vercel's GitHub integration**: once the repo is linked to the Vercel
project, **every push to `main` triggers an automatic Vercel build + deploy** (`vercel.json` pins
the Vite framework, `npm run build`, and `dist/` output). That is the "auto-sync on code update".

First-time setup (run in your own Terminal — pushing needs your GitHub login, which I can't enter):

```bash
cd ~/Desktop/"Claude Code"/financial-budgeting-copilot
rm -rf .git                      # clear the half-initialized repo from the sandbox
git init
git add -A
git commit -m "MOMAH Financial & Budgeting Copilot demo"
git branch -M main
git remote add origin https://github.com/liucheng77/MOMAH-finbudcop.git
git push -u origin main
```

Then link it to Vercel (one time):
1. In the Vercel project **momah-finbudcop → Settings → Git**, connect the `liucheng77/MOMAH-finbudcop` repo.
2. Vercel auto-detects Vite (Build `npm run build`, Output `dist`). Deploy.

After that, **every `git push` auto-deploys**. The app is at your Vercel URL; the single-file build
is at `…/standalone.html`.

**Optional local auto-push:** double-click `watch-sync.command` — it commits + pushes on every file
change (requires git auth configured), and each push triggers a Vercel deploy.

> Security note: never paste access tokens into chat or commit them. Authenticate with `gh auth login`
> or Vercel's own login. If a token was ever shared in plaintext, revoke it and issue a new one.

## Notes

All figures, vendors and entities are **synthetic demo data**. The platform only recommends and is
read-only — it never edits source data, executes payments, or auto-approves.

Stack: React 18 · Recharts · Vite · plain CSS (Balady design tokens).
