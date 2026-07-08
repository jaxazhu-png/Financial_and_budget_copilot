# GRP Finance & Budgeting Dashboard — Clarification Checklist

**Context:** Aligning the BIDSC "Budget & Expenditure" Qlik Sense dashboard (GRP Data & KPIs document, v. 6 May 2026) with the **Financial & Budgeting Copilot** project. The dashboard is not currently listed as one of our data sources, but its data model and KPI definitions overlap heavily with our budget-execution use cases (performance & spend analysis, budget execution monitoring, revenues & collections, costs & funds). We want our Copilot's numbers to align with the official BIDSC dashboard rather than diverge.

---

## 1. Data model & field semantics (highest priority for us)

- Confirm the meaning of **`SEGMENT7`**: is `10` = Fund liquidity (MoF support) and `20` = Revenue liquidity (municipal service income)? Are there other values?
- Confirm the **`BABCODE`** economic classification mapping: `1` = Worker compensations, `2,7,8` = Goods & services, `3` = Programs (opex), `4` = Projects (capex). What are codes 5, 6 (and any others)?
- Difference between **`BUDGET`**, **`BEGIN_BUDGET`**, and **`NAT_INVOICE_AMOUNT`** — is `BEGIN_BUDGET` the original appropriation and `BUDGET` the revised/current one? Is `NAT_INVOICE_AMOUNT` actual paid spend, or does it also include committed/encumbered amounts?
- The dimension hierarchy **Municipality (Amana) → Sub-municipality → Spending article (`SEGMENT5_DISCR` / البند)** — can you share the code lists / reference tables (municipality codes, sub-municipality codes, article numbers) and confirm these articles are the MoF-defined ones?

## 2. Data sources & architecture

- The **SQL Server data warehouse** (built via SSIS): what is the refresh cadence and latency?
- Which upstream systems feed it — central **Oracle**, municipal **MSSQL**, **SADAD** (payments), **Efaa** (fines) — and at what granularity?
- Can the Copilot **consume the same warehouse** as its unified data layer, or is a separate feed/extract expected? Who owns access provisioning?

## 3. Dashboard purpose, audience & status

- Who are the primary users today — MOMAH finance department, ministry leadership/decision support, Amana-level finance managers, MoF-facing?
- Is the dashboard **in production or in development**? What decisions does it drive, and at what frequency (daily/monthly/quarterly)?
- Is it purely **descriptive/monitoring**, or does it include any forecasting / alerting logic?

## 4. KPI ownership & source of truth

- Is **BIDSC the authoritative owner** of the budget-execution KPI definitions we should align to?
- Are these definitions **frozen/governed**, or still evolving? How are changes communicated?

## 5. Scope completeness

- The document defines **Budget, Expenditure, Initiatives, Services, Contracts, and Revenues** datasets, but the listed KPIs only cover the **Budget & Expenditure** dashboard. Are there **additional dashboards** (revenues, contracts, initiatives, services) — and can we get their KPI documents too?
- Any planned KPIs not yet in this document?

## 6. Possible typo to confirm

- KPI **#3 / #6 / #9 (spending percentages)**: the equations show `NAT_INVOICE_AMOUNT / NAT_INVOICE_AMOUNT`. Based on the descriptions these should be **`NAT_INVOICE_AMOUNT / BUDGET`** (spend ÷ budget). Please confirm so we don't replicate an incorrect formula.

## 7. Classification & data sharing

- The document is marked **Secret (سري)**. What may we use for the project — the **definitions only**, or also **sample/real data**? What is the approval process and the appropriate handling/storage?

---

## Draft email to Hassan

**Subject:** GRP Finance & Budgeting dashboard — a few clarifications to align with the Copilot

Hi Hassan,

Thanks for sharing the Finance & Budgeting Data & KPIs document. I've gone through it, and the data model and KPI definitions map closely onto several of our Financial & Budgeting Copilot use cases (budget execution monitoring, performance & spend analysis, revenues, and costs). Even though the dashboard isn't formally one of our data sources, I'd like to align our logic and numbers with the official BIDSC definitions rather than build something that diverges.

Could we set up a short call (30 minutes) this week? Ahead of it, a few areas I'd like to understand — I've attached a short checklist, but the main points are:

- Field semantics: `SEGMENT7` (10/20), `BABCODE` classification, and the difference between `BUDGET`, `BEGIN_BUDGET`, and `NAT_INVOICE_AMOUNT`.
- The warehouse and sources (SQL Server / SSIS, Oracle, municipal MSSQL, SADAD, Efaa) — and whether our Copilot can consume the same layer.
- The dashboard's audience, status (in production vs. in progress), and whether BIDSC owns the KPI definitions we should align to.
- Whether there are additional dashboards beyond Budget & Expenditure (revenues, contracts, initiatives).
- One small thing to confirm: the spending-percentage KPIs (#3/#6/#9) look like they should be spend ÷ budget rather than spend ÷ spend — likely just a copy error in the doc.

Also, since the document is classified Secret, could you let me know what we're able to use on our side (definitions only, or sample data) and the right process for handling it?

Happy to work around your schedule. Thanks again.

Best regards,
Iris
