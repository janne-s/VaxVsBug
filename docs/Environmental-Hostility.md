# VaxVsBug - Environmental Hostility Method

## Purpose

This document describes how `environmental_hostility` values are assigned in the app.

It is not a direct scientific metric imported from one official source.
It is a comparative app model informed by epidemiological concepts and official disease documentation.

## What This Model Represents

`environmental_hostility` is meant to capture:

- how strongly a disease tends to spread in the app's shared scenario
- before vaccine protection reduces the risk

It is informed by:

- transmission mode
- spread potential
- circulation or carriage context
- outbreak behavior

It is not intended to represent:

- annual incidence
- lifetime risk
- one official published number

## Shared Scenario

The model assumes:

- a modern society
- the disease is circulating
- community protection varies
- the value reflects how hostile the disease environment becomes when protection is weak

## Score Meaning

For the scored columns:

- `1` = low
- `3` = medium
- `5` = very high

## Scoring Rule

`environmental_hostility` is currently assigned in two steps:

1. Score the disease on:
   - `Spread potential`
   - `Circulation / carriage context`
   - `Outbreak behavior`

2. Convert the overall judgment into a bounded decimal value

This is not a strict mathematical formula.
It is a structured comparative judgment.

Use this rough mapping:

- mostly `1`s -> `0.05–0.15`
- low-to-mixed scores -> `0.15–0.30`
- mostly `3`s -> `0.30–0.50`
- mostly `4`s -> `0.50–0.70`
- near-maximum spread pressure -> `0.70+`

Important:

- assign values comparatively across the whole disease set
- do not assign each disease in isolation
- after scoring one disease, sanity-check it against nearby diseases in the table
- assign `environmental_hostility` primarily from spread behavior; `severity pressure` may be used as a secondary calibration check or soft modifier so the final educational model remains honest

## Slider Relation

The app uses `environmental_hostility` together with vaccine rate and vaccine effectiveness to calculate disease risk:

```txt
effective_infection_risk =
environmental_hostility x (1 - vaccination_rate x vaccine_effectiveness)
```

Where:

- `environmental_hostility` is the baseline disease-pressure value in the app scenario
- `vaccination_rate` is the community vaccine rate chosen with the slider
- `vaccine_effectiveness` is the selected vaccine's protection value in the dataset

This means the slider does not change the disease's underlying hostility.
It changes how much of that hostility is still able to produce infection.

## Calibration Tables

### Spread Pressure

| Disease | Transmission mode | Spread potential (1–5) | Circulation / carriage context (1–5) | Outbreak behavior (1–5) | Suggested hostility (1–5) | Suggested `environmental_hostility` |
|---|---|---:|---:|---:|---:|---:|
| Measles | Airborne | 5 | 4 | 5 | 5 | 0.75 |
| Varicella | Airborne + direct contact | 4 | 4 | 4 | 4 | 0.55 |
| Rotavirus | Fecal-oral + environmental contamination | 4 | 4 | 4 | 4 | 0.50 |
| Hepatitis A | Fecal-oral / contaminated food or water / close contact | 4 | 2 | 4 | 3 | 0.25 |
| Cholera | Contaminated water or food / fecal-oral | 3 | 2 | 5 | 3 | 0.28 |
| Typhoid | Contaminated water or food / fecal-oral | 3 | 2 | 3 | 2 | 0.20 |
| Pertussis | Droplets / close respiratory spread | 4 | 4 | 4 | 4 | 0.45 |
| Influenza | Droplets + close contact | 4 | 5 | 3 | 4 | 0.45 |
| Mumps | Droplets / close contact | 3 | 3 | 4 | 3 | 0.35 |
| Rubella | Airborne droplets | 3 | 3 | 3 | 3 | 0.30 |
| Diphtheria | Droplets / close contact | 3 | 2 | 4 | 3 | 0.30 |
| Hepatitis B | Blood and body fluids / perinatal / sexual | 2 | 2 | 1 | 2 | 0.15 |
| Pneumococcal | Respiratory secretions + carriage | 3 | 4 | 2 | 3 | 0.25 |
| Polio | Mainly fecal-oral | 4 | 1 | 4 | 3 | 0.25 |
| Hib | Respiratory spread + carriage | 3 | 2 | 2 | 2 | 0.18 |
| Meningococcal | Close / prolonged contact + carriage | 2 | 2 | 3 | 2 | 0.12 |

### Severity Pressure

| Disease | Acute severity (1–5) | Hospitalization burden (1–5) | Long-term harm (1–5) | Fatality pressure (1–5) | Severity pressure (1–5) |
|---|---:|---:|---:|---:|---:|
| Measles | 4 | 4 | 4 | 4 | 4 |
| Varicella | 2 | 2 | 2 | 2 | 2 |
| Rotavirus | 3 | 3 | 1 | 2 | 2 |
| Hepatitis A | 3 | 2 | 1 | 2 | 2 |
| Cholera | 5 | 4 | 1 | 4 | 4 |
| Typhoid | 4 | 4 | 2 | 3 | 3 |
| Pertussis | 3 | 4 | 2 | 3 | 3 |
| Influenza | 3 | 3 | 2 | 3 | 3 |
| Mumps | 2 | 2 | 3 | 1 | 2 |
| Rubella | 1 | 1 | 5 | 2 | 3 |
| Diphtheria | 4 | 4 | 4 | 4 | 4 |
| Hepatitis B | 2 | 2 | 5 | 4 | 4 |
| Pneumococcal | 3 | 4 | 4 | 4 | 4 |
| Polio | 3 | 2 | 5 | 3 | 4 |
| Hib | 4 | 4 | 4 | 3 | 4 |
| Meningococcal | 5 | 5 | 5 | 5 | 5 |

## Interpretation Notes

- `Measles` stands out as the strongest spread-pressure disease in this set.
- `Influenza` is ambient and common, even if its outbreak dynamics differ from measles.
- `Hepatitis A` has meaningful spread potential and outbreak behavior in the right sanitation or close-contact settings, but it does not carry the chronic long-term burden of hepatitis B.
- `Cholera` has lower ambient circulation in the app's shared scenario, but can surge explosively in outbreaks when water, sanitation, and hygiene conditions fail.
- `Typhoid` is less explosively outbreak-driven than cholera, but remains strongly tied to unsafe water, sanitation, and chronic human transmission.
- `Polio` has high spread capability in the wrong environment, but low present-day circulation in many developed-world contexts.
- `Hepatitis B` has lower ambient spread pressure in the app's shared scenario, but high long-term severity because chronic infection can lead to cirrhosis and liver cancer.
- `Meningococcal` is severe, but not ambient in ordinary community spread the way measles or influenza are.
- `Pneumococcal`, `Hib`, and `Meningococcal` are all influenced by carriage dynamics, which makes their spread pressure different from diseases that mainly present as obvious acute outbreaks.
- `Severity pressure` is a separate judgment from spread pressure. It is grounded in acute illness, hospitalization, long-term sequelae, and fatality burden rather than transmissibility alone.

## Severity Score Meaning

For the severity columns:

- `Acute severity`
  - how serious the immediate illness can become
- `Hospitalization burden`
  - how strongly the disease drives hospital-level illness
- `Long-term harm`
  - disability, neurologic injury, hearing loss, amputation, chronic sequelae, or congenital harm
- `Fatality pressure`
  - how strongly death is part of the disease burden
- `Severity pressure`
  - the overall educational severity judgment for the app

Note:

- `Severity pressure` is not the primary driver of `environmental_hostility`
- it is intended as a secondary calibration check or soft modifier after spread-related scoring

## Source Basis

These scores were inferred from official disease descriptions and public-health framing.
They were not copied from one pre-existing hostility table.

### Measles

- CDC: https://www.cdc.gov/measles/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/measles
- EU: https://vaccination-info.europa.eu/en/measles

### Pertussis

- CDC: https://www.cdc.gov/pertussis/signs-symptoms/index.html
- NHS: https://www.nhs.uk/conditions/whooping-cough/
- EU: https://vaccination-info.europa.eu/en/pertussis

### Mumps

- CDC: https://www.cdc.gov/mumps/about/index.html
- NHS: https://www.nhs.uk/conditions/mumps/
- ECDC: https://www.ecdc.europa.eu/en/mumps/facts

### Rubella

- CDC: https://www.cdc.gov/rubella/about/index.html
- ECDC: https://www.ecdc.europa.eu/en/rubella/factsheet

### Varicella

- CDC: https://www.cdc.gov/chickenpox/about/index.html
- NHS: https://www.nhs.uk/conditions/chickenpox/
- ECDC: https://www.ecdc.europa.eu/en/varicella/facts

### Polio

- CDC: https://www.cdc.gov/polio/about/index.html
- NHS: https://www.nhs.uk/conditions/polio/
- ECDC: https://www.ecdc.europa.eu/en/poliomyelitis/facts

### Hib

- CDC: https://www.cdc.gov/hi-disease/about/index.html
- NHS: https://www.nhs.uk/conditions/hib/
- ECDC: https://www.ecdc.europa.eu/en/invasive-haemophilus-influenzae-disease/facts

### Influenza

- CDC: https://www.cdc.gov/flu/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)
- ECDC: https://www.ecdc.europa.eu/en/seasonal-influenza/facts/factsheet

### Rotavirus

- CDC: https://www.cdc.gov/rotavirus/about/index.html
- ECDC: https://www.ecdc.europa.eu/en/rotavirus-infection/facts

### Hepatitis B

- CDC: https://www.cdc.gov/hepatitis-b/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/hepatitis-b
- ECDC: https://www.ecdc.europa.eu/en/hepatitis-b/facts

### Hepatitis A

- CDC: https://www.cdc.gov/hepatitis-a/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/hepatitis-a
- ECDC: https://www.ecdc.europa.eu/en/hepatitis-a

### Cholera

- CDC: https://www.cdc.gov/cholera/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/cholera

### Typhoid

- CDC: https://www.cdc.gov/typhoid-fever/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/typhoid

### Pneumococcal

- CDC: https://www.cdc.gov/pneumococcal/about/index.html
- ECDC: https://www.ecdc.europa.eu/en/pneumococcal-disease/facts

### Diphtheria

- CDC: https://www.cdc.gov/diphtheria/about/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/diphtheria

### Meningococcal

- CDC: https://www.cdc.gov/meningococcal/index.html
- WHO: https://www.who.int/news-room/fact-sheets/detail/meningococcal-meningitis
- ECDC: https://www.ecdc.europa.eu/en/meningococcal-disease

## Status

This is a calibration document for the open-source project.

Before updating app values, each row should still be reviewed against:

- the disease's current app outcome model
- the disease's current category and framing
- whether the resulting chart gives an honest educational impression
