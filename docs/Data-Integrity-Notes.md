# Data Integrity Notes

This document is a simple note set for the current `App/data.json`.

It is not a medical paper. Its purpose is to show how grounded the app's disease and vaccine probabilities are, where the app still simplifies things, and how those choices relate to the app's structure.

The data, wording, and source links in the app have also been manually reviewed. These notes describe the current state after that review, not an unfiltered draft dataset.

## Point System

### Disease integrity

- `5/5`
  - Very strong support and very little app-only shaping.
- `4/5`
  - Strong support. Good enough for the app, but still simplified.
- `3/5`
  - Reasonable support, but the app model is doing more work.
- `2/5`
  - Limited support from the current source set.
- `1/5`
  - Mostly app-derived.

### Vaccine integrity

- `5/5`
  - Very strong support and very little app-only shaping.
- `4/5`
  - Strong support. Good enough for the app, but still simplified.
- `3/5`
  - Reasonable support, but still somewhat approximate.
- `2/5`
  - Limited direct support from the current source set.
- `1/5`
  - Mostly app-derived.

## App Notes

- This app is not trying to be a clinical tool. The goal is simpler: probabilities should feel grounded in reality.
- Rare severe outcomes are often easier to ground than common illness buckets.
- Common illness buckets are often the most simplified part of the app.
- `fatal outcome` should usually be read as a `global mixed setting` style value, not a strict high-income-only or outbreak-only number.
- `environmental_hostility` is an app variable, not a direct official statistic.
- `environmental_hostility` should be judged comparatively across diseases, not in isolation.

## Disease By Disease

### Measles
- Disease integrity: `4/5`
- Vaccine integrity: `5/5`
- App note:
  - Severe complications and fatality are well grounded.
  - The main acute illness bucket is still a remainder bucket.
  - `Immune amnesia` is worth keeping as an app note even though it is not a neat single-number outcome.

### Pertussis
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Hospitalization, pneumonia, seizure, and death are well grounded.
  - The prolonged illness bucket is still simplified.
  - The DTaP side is source-based, but compressed into clean app categories.

### Mumps
- Disease integrity: `4/5`
- Vaccine integrity: `5/5`
- App note:
  - The row is grounded by asymptomatic infection, meningitis, encephalitis, and hearing-loss context.
  - The complication buckets are still merged for app clarity.

### Rubella
- Disease integrity: `4/5`
- Vaccine integrity: `5/5`
- App note:
  - The row is grounded by the high asymptomatic fraction, mild rash illness, and rare severe complications.
  - Pregnancy-related harm is very important, but too context-specific for the general app row.

### Varicella
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The row is grounded by typical mild illness, hospitalization burden, and fatality context.
  - Severe complications are real, but still merged into a simpler app structure.

### Polio
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Paralysis, fatality among paralytic cases, and post-polio syndrome are well grounded.
  - The mild illness split is still partly app-shaped.

### Hib
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Fatality and long-term neurologic harm are well grounded.
  - The long-term effect is one of the stronger app entries.

### Influenza
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Illness, hospitalization, and fatality are grounded well enough for the app.
  - The row is still a simplified seasonal-risk model rather than a literal annual table.

### Rotavirus
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The dehydration and hospitalization logic is strong.
  - `Intussusception` is one of the strongest vaccine-side serious outcomes in the app.

### Hepatitis B
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The chronic-infection logic is well grounded.
  - The app still compresses a timeline disease into a simpler structure.

### Hepatitis A
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The acute structure fits the app fairly well.
  - Fulminant liver failure is rare but grounded enough to keep.

### Cholera
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The row is now grounded by the large asymptomatic fraction, a smaller severe-dehydration fraction, and rapid fatality if untreated.
  - The cholera vaccine row is simple, but WHO support is good enough for this app.

### Typhoid
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Complications, fatality context, and chronic carrier state are all useful supports.
  - The main illness bucket is still simplified.

### Pneumococcal
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - Severe invasive disease and sequelae are well grounded.
  - The common pneumonia / ear-infection bucket remains simplified.

### Diphtheria
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The current row now reflects asymptomatic infection, severe throat disease, toxin complications, and fatality well enough.
  - Still simplified, but in a fair way for the app.

### Meningococcal
- Disease integrity: `4/5`
- Vaccine integrity: `4/5`
- App note:
  - The disease row is one of the strongest in the app because fatality and long-term disability are so well supported.
  - The MenACWY vaccine row is now grounded well enough, but still simplified across products.