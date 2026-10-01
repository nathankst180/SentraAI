# RAWBANK SENTINEL — Synthetic Structured Knowledge Base Specification

## Purpose

This resource pack defines the **single canonical structured transaction-fact CSV** used for both workshop builds:

1. **Sentinel Command Centre** — BI/operations dashboard.  
2. **Fraud Investigation Copilot** — natural-language investigation over structured data, with DuckDB used for exact queries and the LLM used for planning/reasoning.

The dataset is an **academic simulation inspired only by publicly documented Rawbank products/services**. It is **not Rawbank customer data, transaction data, fraud data, internal controls, architecture, rules, vulnerabilities, or incident history**.

## Why the schema is Rawbank-tailored

Rawbank publicly describes:

- 500,000+ Corporate/SME/Retail customers, 100+ branches in 19 provinces, Illicocash, online banking and 320+ ATMs.  
- RawbankOnline capabilities including transfers, beneficiaries, statements, mass transfers, card management and international transfers.  
- Illicocash wallet operations including wallet/Rawbank transfers, Send Cash, money requests, airtime, TV payments, international transfer and cardless ATM withdrawal.  
- Visa/card products, Visa Direct, ATM deposit, Alert Banking, SIOP and Swift Light corporate payment flows.

Official/public sources:

- [https://rawbank.com/en/blog/rawbanks-commitment-to-equality-recognized-through-the-distinction-awarded-to-its-chief-executive-officer/](https://rawbank.com/en/blog/rawbanks-commitment-to-equality-recognized-through-the-distinction-awarded-to-its-chief-executive-officer/)  
- [https://rawbank.com/en/corporate/services-en-ligne/rawbank-online/](https://rawbank.com/en/corporate/services-en-ligne/rawbank-online/)  
- [https://test.rawbank.com/en/banque-a-distance/illicocash/](https://test.rawbank.com/en/banque-a-distance/illicocash/)  
- [https://rawbank.com/en/produits/service-visa-direct/](https://rawbank.com/en/produits/service-visa-direct/)  
- [https://rawbank.com/en/cartes/](https://rawbank.com/en/cartes/)  
- [https://rawbank.com/en/banque-a-distance/alert-banking/](https://rawbank.com/en/banque-a-distance/alert-banking/)  
- [https://rawbank.com/en/corporate/produits/siop/](https://rawbank.com/en/corporate/produits/siop/)  
- [https://rawbank.com/en/corporate/produits/swift-light/](https://rawbank.com/en/corporate/produits/swift-light/)  
- [https://rawbank.com/en/services/](https://rawbank.com/en/services/)  
- [https://rawbank.com/en/la-banque/trouver-une-agence/](https://rawbank.com/en/la-banque/trouver-une-agence/)

## Canonical file to generate

`RAWBANK_SENTINEL_MASTER.csv`

**Grain:** one row \= one synthetic transaction/event from the perspective of one primary customer/account.

Recommended size:

- 2,400–2,600 transaction rows  
- default target: 2,500  
- \~120 synthetic customers  
- \~180 synthetic beneficiaries  
- \~145 synthetic devices  
- 90-day history

The master schema contains 110 columns.

## Architectural rule

**Do not embed this entire CSV into FAISS.**

Structured questions such as:

- “Show transactions over USD 2,000 from untrusted devices in the last seven days”  
- “How many accounts used DEV-00133?”  
- “Which beneficiaries received money from more than five unrelated customers?”  
- “What happened 30 minutes before TXN-…?”

must be answered through **DuckDB / deterministic SQL**.

FAISS \+ `intfloat/multilingual-e5-small` should be reserved for unstructured knowledge:

- workshop fraud policy  
- fraud taxonomy  
- investigation playbook  
- Rawbank research KT  
- governance / operating guidance

Groq `openai/gpt-oss-20b` then plans the query and synthesizes evidence-backed answers.

## Ground truth rule

`RAWBANK_SENTINEL_GROUND_TRUTH.csv` must be created separately using the schema in `04_RAWBANK_SENTINEL_GROUND_TRUTH_SCHEMA.csv`.

**Never load it into the application.**

It exists only to evaluate whether the final Copilot:

- detects/investigates the injected scenarios,  
- resists false positives,  
- cites the right evidence,  
- says “insufficient evidence” when appropriate.

## Data generation quality rules

1. Generate programmatically from one deterministic seed.  
2. Maintain referential consistency for customer, account, beneficiary and device IDs.  
3. Build customer histories chronologically before calculating rolling features.  
4. Derived metrics must be calculated, not randomly invented:  
   - amount\_to\_median\_ratio  
   - txn\_count\_10m  
   - txn\_count\_1h  
   - outbound\_amount\_1h\_usd  
   - beneficiary\_prior\_txn\_count  
   - beneficiary\_distinct\_sender\_count\_30d  
   - device\_accounts\_seen\_30d  
5. Normal transactions must dominate the dataset.  
6. Fraud scenarios must be multi-signal, not “high amount \= fraud.”  
7. Include benign high-value and cross-border cases to create false-positive pressure.  
8. Use synthetic names/IDs only.  
9. No Aadhaar/PAN/real bank-account/card numbers/real phone numbers.  
10. Do not state that any synthetic rule, pattern or vulnerability is a Rawbank fact.

## Recommended synthetic fraud scenarios

- Account takeover  
- New beneficiary \+ high value  
- Velocity burst  
- Impossible travel  
- Shared device across unrelated accounts  
- Mule-like common beneficiary network  
- Card-not-present anomaly  
- Recent credential-reset abuse  
- Corporate approval anomaly  
- Cross-border behavioral anomaly  
- Benign anomaly / deliberate false-positive case

## Command Centre KPIs supported by this schema

- Transaction count/value  
- Currency mix  
- Alert count/rate  
- Critical/high/medium alerts  
- Potential exposure  
- Alerts by channel  
- Alerts by suspected pattern  
- Alert trend over time  
- Province/city heatmap  
- Top risk customers  
- Top repeated beneficiaries  
- Shared/high-risk devices  
- Cross-border exposure  
- Case queue / analyst queue / escalation  
- Disposition outcomes

## Copilot investigations supported by this schema

- Explain why a transaction was flagged  
- Compare current amount with 30/90-day behavior  
- Reconstruct customer timeline  
- Find new/untrusted devices  
- Find recent login failures/password changes/SIM changes  
- Find new beneficiaries  
- Find common beneficiaries across customers  
- Find devices shared across accounts  
- Detect velocity bursts  
- Detect impossible travel  
- Analyze cross-border deviations  
- Inspect corporate approval anomalies  
- Identify counter-evidence and plausible false positives  
- Generate case/escalation summaries

## Files in this pack

- `01_RAWBANK_SENTINEL_MASTER_SCHEMA.csv` — complete data dictionary  
- `02_RAWBANK_SENTINEL_CONTROLLED_VALUES.csv` — controlled vocabulary  
- `03_RAWBANK_SENTINEL_MASTER_TEMPLATE.csv` — exact CSV header \+ sample synthetic rows  
- `04_RAWBANK_SENTINEL_GROUND_TRUTH_SCHEMA.csv` — evaluator-only hidden labels  
- `05_RAWBANK_SENTINEL_GENERATION_PROFILE.csv` — volume/distribution/quality targets