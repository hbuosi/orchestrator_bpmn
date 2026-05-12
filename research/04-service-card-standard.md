# Government Service Card Standard

## UAE TDRA — Government Service Specifications Manual

Source: UAE TDRA (Telecommunications and Digital Government Regulatory Authority)  
URL: https://u.ae/en/about-the-uae/digital-uae/digital-government

### 15 Mandatory Fields

| # | Field | Notes |
|---|-------|-------|
| 1 | Service Name (AR + EN) | Bilingual mandatory |
| 2 | Service Code | e.g., "MOI-001", "TAMM-TL-001" |
| 3 | Service Category | life-event / business / informational |
| 4 | Owning Entity | Ministry or authority name |
| 5 | Service Channel(s) | online / app / call-center / in-person |
| 6 | Target Segment | citizen / resident / business / visitor |
| 7 | Eligibility Criteria | Bulleted list |
| 8 | Required Documents | Name + format + notes |
| 9 | Fees | Table by channel and applicant type |
| 10 | Processing Time / SLA | Working days per channel |
| 11 | Legal Basis | Law reference |
| 12 | Service Level | Proactive / Transactional / Informational |
| 13 | Transformation Stage | paper → digital → smart → proactive |
| 14 | UAE Pass Enabled | Bool + Level (1/2/3) |
| 15 | Output Documents | Name, format, validity, delivery method |

---

## Abu Dhabi TAMM Extensions

Platform: https://www.tamm.abudhabi  
Authority: ADDA (Abu Dhabi Digital Authority) — https://adda.gov.ae

Additional fields:
- **Life Event linkage** — 12 core life events (e.g., "Start a Business", "Welcome to Abu Dhabi")
- **Journey Steps** — max 7 steps per TAMM UX guidelines
- **Pre-requisite services** — dependency graph (e.g., trade name reservation before license)
- **Integration APIs** — backend systems called during the service
- **ADDA Compliance Level** — integration certification level

---

## UAE Pass Integration Levels

**Platform:** https://www.uaepass.ae  
**Dev docs:** https://docs.uaepass.ae  
**Legal basis:** Federal Decree-Law No. 46 of 2021 on Electronic Transactions and Trust Services

| Level | Description | Tech |
|-------|-------------|------|
| 1 | Authentication only | OAuth 2.0 / OpenID Connect |
| 2 | Identity data sharing | Citizen name, EID#, DOB, address (with consent) |
| 3 | Digital signature | PKCS#7/CAdES — legally equivalent to handwritten signature |

---

## UK GDS Reference (GOV.UK)

Design System: https://design-system.service.gov.uk  
Service Manual: https://www.gov.uk/service-manual  

GOV.UK service cards include: name, description, owning dept, eligibility, channels, time, cost, legislation, related services.

---

## Transformation Stage Maturity Model (UAE)

```
Paper → Digital → Smart → Proactive
  │          │        │         │
Manual    Web form  Mobile   Gov pushes
process   only      + APIs   service to
                             citizen
                             before asked
```
