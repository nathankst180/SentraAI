# RAWBANK SENTIENT — Master Data Rules, Policy & SOP

> **Academic simulation only.** Rawbank public information is used only for business/product context.  
> All customers, transactions, devices, beneficiaries, alerts, cases and fraud scenarios are synthetic.

---

## 1\. Canonical Data File

Use only:

`RAWBANK_SENTIENT_KB.csv`

Target volume:

- 2,400–2,600 transaction rows  
- \~100–140 synthetic customers  
- \~150–220 beneficiaries  
- \~120–170 devices  
- \~90 days of activity

**One row \= one synthetic banking transaction/event.**

The same CSV powers:

1. **Sentient Command Centre**  
2. **Fraud Investigation Copilot**

---

## 2\. Data Population Order

Always generate in this order:

1. **Customers**  
2. **Accounts / packages / cards**  
3. **Beneficiaries**  
4. **Devices / sessions**  
5. **Normal transaction history**  
6. **Inject selected fraud / anomaly scenarios**  
7. **Calculate derived behavioural fields**  
8. **Apply product/control rules**  
9. **Apply synthetic fraud rules**  
10. **Create alerts / cases**  
11. **Run QA**  
12. **Export final CSV**

Do not generate every row independently.

---

## 3\. Rawbank-Tailored Product Rules

Keep generated data consistent with publicly documented Rawbank products/channels.

### Customer / package context

Use combinations such as:

- **Eco**  
- **Premium**  
- **Prestige**  
- **Infinite**  
- **Employee**  
- **Academia**  
- **Diaspora**  
- **Lady's First**  
- **SME**  
- **Corporate**

### Supported synthetic channels

- `ILLICOCASH`  
- `RAWBANK_ONLINE`  
- `CARD`  
- `ATM`  
- `BRANCH`  
- `AGENT_BANKING`  
- `VISA_DIRECT`  
- `SIOP`  
- `SWIFT_LIGHT`

### Key consistency rules

- Illicocash → model mainly **CDF / USD** wallet activity.  
- RawbankOnline → model transfers, bills, beneficiaries, statements and corporate validation flows.  
- SIOP → **Corporate** payment scenarios only.  
- Swift Light → **Corporate** scenarios only.  
- Diaspora → cross-border activity can be normal.  
- Corporate / Premium / Prestige / Infinite → high-value transactions can be legitimate.  
- Do not use transaction value alone as fraud evidence.

---

## 4\. Public Product-Control Rules

Treat these as **control rules**, not fraud proof.

### Visa Direct

Publicly documented limits:

- USD 1,000 / transaction  
- USD 2,500 / day  
- USD 5,000 / week  
- USD 10,000 / month

A breach should create a **control exception / review**, not automatically "fraud".

### ATM Deposit

Workshop modeling:

- Normal ATM Deposit → max USD 4,000  
- ATM Recycler → max USD 9,900

A breach is a **product/control exception**.

### Corporate Approval Flow

For synthetic Corporate payment flows:

`approvals_completed <= approvals_required`

A completed Corporate transaction should normally satisfy:

`approvals_completed == approvals_required`

Otherwise create a workflow anomaly / hold.

---

## 5\. Synthetic Fraud Rules

Use the following as workshop rules only.

| Rule | Condition | Effect |
| :---- | :---- | ----: |
| FR-01 | Amount \>= 5× customer median | \+12 |
| FR-02 | Amount \>= 10× customer median | \+20 |
| FR-03 | New beneficiary | \+12 |
| FR-04 | New / untrusted device | \+12 |
| FR-05 | 3+ failed logins in 30 min | \+14 |
| FR-06 | Password reset within 24h | \+10 |
| FR-07 | Recent SIM change | \+8 |
| FR-08 | 4+ transactions in 10 min | \+14 |
| FR-09 | Abnormal 1-hour outbound value | \+12 |
| FR-10 | Impossible travel | \+20 / hard trigger |
| FR-11 | Unusual country/location | \+7 |
| FR-12 | VPN / proxy signal | \+5 |
| FR-13 | Device used across 3+ accounts | \+13 |
| FR-14 | Beneficiary receives from 5+ customers | \+15 |
| FR-15 | Card-not-present \+ unusual behaviour | \+12 |
| FR-16 | Unusual transaction time | \+4 |
| FR-17 | New device \+ new beneficiary | \+12 |
| FR-18 | Failed logins \+ reset \+ new device | \+18 / hard trigger |
| FR-19 | New cross-border beneficiary \+ abnormal value | \+14 |
| FR-20 | Incomplete Corporate approval | \+25 / hard trigger |

---

## 6\. Counter-Evidence Rules

Risk must also decrease when context is clearly legitimate.

| Condition | Effect |
| :---- | ----: |
| Trusted device \+ established beneficiary | \-12 |
| Recurring / scheduled known payment | \-10 |
| Diaspora \+ expected cross-border activity | \-10 |
| Established Corporate supplier \+ approvals complete | \-15 |
| High-value customer behaving within normal baseline | \-8 |

The system must always surface **supporting evidence and counter-evidence**.

---

## 7\. Alert Scoring

Start from:

`alert_score = 0`

Then:

- add triggered fraud-rule weights  
- subtract counter-evidence weights  
- clamp to `0–100`

Severity:

- `0–19` → NONE  
- `20–34` → LOW  
- `35–54` → MEDIUM  
- `55–74` → HIGH  
- `75–100` → CRITICAL

Create an alert when:

- score \>= 35, or  
- a hard-trigger rule fires, or  
- a product/control rule requires intervention

---

## 8\. Synthetic Scenario Mix

Seed a balanced mix of:

### Fraud / Suspicious

- Account takeover  
- New beneficiary \+ high value  
- Velocity burst  
- Impossible travel  
- Shared device  
- Mule-like beneficiary  
- Card-not-present anomaly  
- Credential-reset abuse  
- Corporate approval anomaly  
- Cross-border anomaly

### Benign / False-Positive Challenges

- High-value established supplier payment  
- Legitimate Diaspora cross-border transfer  
- Premium/Prestige/Infinite high-value normal activity  
- Recurring known beneficiary payment

### Control-Only

- Visa Direct limit breach  
- ATM Deposit limit breach

---

## 9\. Derived Fields

These must be **calculated from the generated history**, never randomly assigned:

- customer median transaction value  
- customer average transaction value  
- amount-to-median ratio  
- 10-minute transaction count  
- 1-hour transaction count  
- 1-hour outbound amount  
- minutes since previous transaction  
- beneficiary prior-transaction count  
- beneficiary distinct-sender count  
- device accounts seen  
- new beneficiary flag  
- new device flag  
- impossible-travel flag  
- unusual-time flag  
- available balance before / after

---

## 10\. Case Workflow

Recommended flow:

`NO ALERT → ALERT → NEW → IN_REVIEW → ESCALATED → CLOSED`

Queue examples:

- Account takeover / credential abuse → `DIGITAL_FRAUD`  
- Card-not-present → `CARD_FRAUD`  
- Corporate/SIOP/Swift anomaly → `CORPORATE_FRAUD`  
- Complex network / mule case → `TIER_2_FRAUD`

Human dispositions:

- `UNREVIEWED`  
- `LEGITIMATE`  
- `SUSPICIOUS`  
- `CONFIRMED_FRAUD`  
- `INSUFFICIENT_EVIDENCE`

The LLM must never set **CONFIRMED\_FRAUD** by itself.

---

## 11\. Copilot Data Policy

The Copilot uses the same CSV.

### Exact / analytical retrieval

Use:

- **Pandas**  
- deterministic Python filters/functions  
- Pydantic validation  
- RapidFuzz for name/entity matching

Examples:

- transaction lookup  
- customer timeline  
- device usage  
- beneficiary network  
- velocity windows  
- channel statistics  
- alert statistics

### Semantic retrieval

Create clean retrieval cards from selected CSV fields and embed using:

`intfloat/multilingual-e5-small`

Runtime:

- local CPU  
- SentenceTransformers  
- 384 dimensions  
- normalized vectors  
- FAISS `IndexFlatL2`

Do not rely on embeddings for exact amounts, IDs, timestamps or counts.

### Reasoning layer

Use:

`Groq openai/gpt-oss-20b`

for:

- intent routing  
- query understanding  
- context synthesis  
- investigation reasoning  
- natural-language answers  
- case summaries

---

## 12\. Copilot Response Structure

Every investigation answer should separate:

1. **Observed facts**  
2. **Derived metrics**  
3. **Triggered rules**  
4. **Supporting evidence**  
5. **Counter-evidence**  
6. **Evidence gaps**  
7. **Recommended analyst action**

Preferred wording:

> "The available evidence is consistent with possible account takeover."

Avoid:

> "This customer committed fraud."

---

## 13\. QA Gate

Do not export the final CSV unless all critical checks pass.

Minimum checks:

- 2,400–2,600 rows  
- unique transaction IDs  
- valid customer/account/entity references  
- stable customer and account attributes  
- valid product/channel combinations  
- correct currency conversions  
- reproducible rolling metrics  
- reproducible beneficiary/device counts  
- no impossible Corporate approval state  
- no hidden ground-truth fields  
- no real customer PII  
- enough normal transactions  
- enough benign anomalies  
- enough fraud-pattern coverage

---

## 14\. Final Architecture

```
RAWBANK_SENTIENT_KB.csv
        │
        ├───────────────┐
        │               │
        ▼               ▼
 Pandas / Python    Retrieval Cards
        │               │
 RapidFuzz          Local E5 CPU
        │               │
        │              FAISS
        │               │
        └───────┬───────┘
                ▼
         Context Builder
                │
                ▼
      Groq GPT-OSS-20B
                │
         ┌──────┴──────┐
         ▼             ▼
Sentient Command   Fraud Investigation
Centre             Copilot
```

---

## 15\. Workshop Rule

**Public Rawbank facts define realistic business context.**

**Synthetic workshop rules define fraud behaviour.**

Never present synthetic fraud rules, thresholds, incidents or vulnerabilities as Rawbank's actual internal policies.