# Quality framework

> The site is organized around the **Donabedian (1966) Structure–Process–Outcome** quality model, operationalized for K‑12 special education with the U.S. Department of Education's **IDEA Part B State Performance Plan / Annual Performance Report (SPP/APR) indicators**. Every district page has exactly three quality chapters: **Structure**, **Process**, **Outcome**. No fourth chapter is ever added.

This document is the architectural record of that decision. If a future change request proposes a fourth chapter, point at this file and refuse.

## Why a framework at all

Earlier iterations of the site were organized by **data source** (CDE SPED‑PS chapter, CA Dashboard chapter, OAH chapter, etc.). Whenever an external observation contradicted what the site showed — e.g., *"Poway is reputed to be one of the best special‑education districts and our metrics don't reflect that"* — the reflex was to add another column. That reflex has no stopping rule: a parent can always propose a missing dimension, and a reactive site grows columns forever, with no principle for what belongs.

The decision recorded here trades that reactive growth for a **closed** framework: a single ontology of service quality with a finite number of buckets. New measures are admitted only when they fit one of the three buckets *and* add information not already there. The chapter count never changes.

## The framework

### Conceptual frame — Donabedian (1966)

Donabedian's *Evaluating the Quality of Medical Care* (Milbank Memorial Fund Quarterly, 1966) defined three exhaustive layers of any service:

- **Structure** — the conditions under which care is provided. People, money, facilities, expertise, policies. *"What is in place."*
- **Process** — the activities that occur within the structure. The interactions, decisions, and procedures that constitute service delivery. *"What happens."*
- **Outcome** — the consequences for the recipient. Health, learning, satisfaction, post‑service status. *"What results."*

Donabedian's central methodological warning, which is exactly the Poway problem:

> *"Outcome measures, by themselves, tell us little or nothing about the nature and the location of the deficiencies."*  
> — Donabedian, 1966

A site that shows only outcomes (assessment results, suspension rates, dispute counts) cannot distinguish a well‑resourced district hampered by demographics from a poorly‑resourced district with easy demographics. The three layers must appear together.

The framework has ~80,000 citations and is the dominant quality‑measurement scaffold in services research. It has been formally adapted to education by the National Research Council and to special education by the Council for Exceptional Children. It is not novel; we are not inventing it.

### Operational frame — IDEA Part B SPP/APR

Within the Donabedian buckets, the federal **Office of Special Education Programs (OSEP)** operationalizes special‑education quality through the **17 State Performance Plan / Annual Performance Report indicators** required of every state since 2005 (restructured under **Results‑Driven Accountability** in 2014). California publishes its **SPP/APR** annually through the CDE Special Education Division.

These are the measures federal monitors, due‑process hearing officers, and special‑education advocates already cite. Adopting them aligns the site with an existing standard rather than inventing one.

The SPP/APR indicators map cleanly into Donabedian:

| Donabedian layer | SPP/APR indicators (Part B) | Other measures that fit |
|---|---|---|
| **Structure** | 11 (timely initial evaluation), 12 (Part C → Part B transition timeliness) | CBEDS staffing files (aides/SLPs/OTs/psychologists per 100 IEP students); SACS expenditure per SWD; FCMAT and CDE compliance reviews; programs research (named programs, BCBA presence, transition‑program existence) |
| **Process** | 5 (LRE 80%+ / <40% / separate setting), 6 (preschool LRE), 8 (parent‑involvement survey), 13 (secondary transition IEPs with measurable post‑secondary goals) | OAH due‑process case counts; OCR open civil‑rights investigations; Community Advisory Committee activity |
| **Outcome** | 1 (graduation), 2 (dropout), 3 (assessment participation and proficiency), 4 (suspension/expulsion disproportionality), 7 (preschool outcomes), 9–10 (disproportionate representation), 14 (post‑school employment / education / training) | Chronic absenteeism rate; Distance from Standard (DFS) gaps |

## The closure principle

This is the central commitment. A new measure is admitted only if it passes the **S/P/O test**:

1. Does the measure describe a precondition that exists prior to service delivery? → **Structure**.
2. Does it describe an activity that occurs during service delivery? → **Process**.
3. Does it describe a consequence that follows from service delivery? → **Outcome**.

If the answer is unambiguous and the measure adds information not already represented inside that bucket, it is admitted **as a finer indicator within the existing chapter**. If the answer is *"none of the above,"* it is not a quality measure — it is a context fact, a demographic, or a complaint, and goes elsewhere on the page (or not at all).

There is no fourth bucket. Equity is a *slice* of outcome (or process), not a category. Parent satisfaction is a perception outcome (or a process responsiveness measure). Innovation is structural capacity. Climate is process. Cost is structure. We have not been able to construct a quality dimension that escapes.

Practical consequence: **the chapter count is fixed at three, forever**. Detail grows; structure does not. The mole‑finding stops.

## Explicit "not measured" UX

A closed framework only delivers on its promise if **what we cannot measure is as visible as what we can**. Every chapter renders a known set of dimensions. Dimensions for which we do not currently have data are shown as labeled *"not currently measured from public data"* slots — not hidden.

This commits us to:
- Honestly admitting that public data cannot capture individual classroom quality, parent‑specific experiences, or IEP‑team responsiveness toward a particular family.
- Not pretending that absence of a metric means absence of the underlying thing.
- Making the site's epistemic limits part of the user interface, not a footnote.

## What this changes about the existing site

The current site has eight per‑district chapters: Overview, Inclusion, Programs, Academics, Discipline, Disputes, Summary, Sources, Schools. Restructuring under this framework produces:

- **Structure** — programs research (autism classrooms, BCBA, transition‑program existence), plus new staffing intensity (CBEDS), investment (SACS), and independent‑review surfaces (FCMAT). Indicators 11, 12, 14 (the compliance portion).
- **Process** — current Inclusion chapter (Indicator 5) + OAH/OCR (current Disputes chapter, reframed as process volume) + parent involvement (Indicator 8) + secondary transition planning (Indicator 13).
- **Outcome** — current Academics + Discipline chapters + post‑school outcomes (Indicator 14, the outcome portion) + graduation/dropout (Indicators 1, 2) + disproportionality (Indicators 9, 10).

Overview, Sources, and Schools remain as page‑level wrappers. AI summaries remain but are recomputed against the three‑chapter structure.

## Citations

- Donabedian, A. (1966). *Evaluating the Quality of Medical Care*. The Milbank Memorial Fund Quarterly, 44(3), 166–206.
- U.S. Department of Education, Office of Special Education Programs (OSEP). State Performance Plan / Annual Performance Report (SPP/APR), Part B Indicators. <https://sites.ed.gov/idea/>
- California Department of Education, Special Education Division. CA SPP/APR. <https://www.cde.ca.gov/sp/se/qa/cassppapr.asp>
- Individuals with Disabilities Education Act (IDEA), 20 U.S.C. §1400 et seq. Results‑Driven Accountability framework (OSEP, 2014).

## Status

Adopted 2026‑05‑30. Implementation tracked in the session task list (#14–#21). Any subsequent change to the framework should update this document in the same commit.
