# Case Note Summary

Turns the structured fields that Case Note Insights (CNI) extracts from a client's
case notes into one human-readable, citation-backed sentence:

> **Mike Woods** is employed part-time at Diner, is housed and dependent on others for
> housing at 123 Jackson St.

The sentence is not free text from the model. Every phrase comes from a fixed template
keyed on the raw `snake_case` enum values in `cniFields`, so the wording is reviewable
and stable. Each phrase carries the quotes from the note that the field was extracted
from, which is what the tooltip UI underlines.

## Pipeline

```
useCaseNoteSummary(summaries, person)
  └─ getCategorizedSummaries()      picks the "employment" and "housing" summaries
  └─ getCaseNoteSummarySegments()   "{fullName} " + employment + ", " + housing + "."
       ├─ getEmploymentSegments()   spec section 1
       ├─ getHousingSegments()      spec section 2
       └─ segmentBuilders           field → segment primitives shared by both
```

Each builder returns `CaseNoteSummarySegment[]` — `{ content, citation? }` — or `null` when
the category can't be templated at all. `getCaseNoteSummarySegments` drops `null` categories
and returns `null` only if nothing survived.

### segmentBuilders

| Helper              | Use                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `usableField`       | Drops a field whose `fieldValue` is blank; the schema types it as a plain string, so emptiness is a value check.                      |
| `citedValue`        | Free-text field → segment, e.g. `employerName` → `" at Acme Corp"`.                                                                   |
| `citedFragment`     | Enum field → segment via a fragment map, e.g. `employmentType: "employee_pt"` → `" part-time"`. Unknown value ⇒ `undefined` + `warn`. |
| `toSegment`         | Wraps literal glue text (`", "`, `" "`) or a templated string plus its citation.                                                      |
| `joinSegmentGroups` | Oxford-comma glue for multiple employers (`a and b`, `a, b, and c`).                                                                  |
| `trimLeadingSpace`  | Strips the leading space a fragment carries so it can open a phrase.                                                                  |

Fragments are stored with their leading space (`" part-time"`) so an absent field simply
contributes nothing and no double spaces appear.

`citedValue` and `citedFragment` both call `usableField` internally, so call sites pass raw
fields and never wrap them. Call `usableField` explicitly only where a field's value drives
control flow instead of producing a segment — branching on `primaryStatus`, or testing
whether `temporaryHousingName` is present. Comparisons against a non-empty literal
(`employmentType?.fieldValue === SELF_EMPLOYED`) already exclude blanks and need no wrap.

## Section 1 — Employment (`getEmploymentSegments`)

### 1a. `primaryStatus = 'unemployed'`

`"is unemployed[, {SEARCH_FRAG}]"`

| `searchStatus`  | fragment                             |
| --------------- | ------------------------------------ |
| `searching`     | `and is actively searching for work` |
| `not_searching` | `and is not currently searching`     |
| absent          | omitted                              |

### 1b. `primaryStatus = 'employed'`, no employers

`"is employed"`

### 1c. `employed`, single non-self-employed employer

`"is employed [EMP_TYPE_FRAG] [JOB_TITLE_FRAG] at {employerName}[ in {employerLocation}]"`

| `employmentType`  | fragment                    |
| ----------------- | --------------------------- |
| `employee_ft`     | `full-time`                 |
| `employee_pt`     | `part-time`                 |
| `contractor_1099` | `as a contractor`           |
| `temp_agency`     | `through a staffing agency` |
| `seasonal`        | `seasonally`                |
| `intern`          | `as an intern`              |
| `apprentice`      | `as an apprentice`          |
| `gig`             | `doing gig work`            |
| `day_labor`       | `doing day labor`           |
| `cash_informal`   | `doing informal work`       |
| `self_employed`   | `self-employed` (see 1d)    |
| absent / unknown  | omitted                     |

`jobTitle` → `as a {jobTitle}`, `employerLocation` → `in {employerLocation}`; both omitted
when absent.

> is employed full-time as a cashier at Acme Corp in Boise, ID

### 1d. `employed`, single self-employed employer

`"is self-employed[ as a {jobTitle}][, in {employerLocation}][, earning {payRateAmount}]"`

Self-employment reorders the phrase, drops `employerName`, and is the only case that renders
a pay rate.

> is self-employed as a consultant, in Denver, CO, earning $75/hour

### 1e / 1f. Two or more employers

Each employer renders its own 1c/1d phrase; phrases are joined `A and B` for two, and
`A, B, and C` for three or more.

> is employed full-time as a cashier at Acme Corp, part-time at BuildCo, and at FastFood Inc.

### 1g. `primaryStatus` absent or unrecognized

Returns `null` and warns; the employment clause is dropped from the sentence.

The spec notes that rows with a null `primaryStatus` are excluded upstream by the view's
`WHERE` clause, so the absent case shouldn't reach us. The guard is kept because it also
catches a present-but-blank value, which the `WHERE` clause may not.

## Section 2 — Housing (`getHousingSegments`)

### 2a. `primaryStatus = 'in_custody'`

`"is currently in custody"`

### 2b. `primaryStatus = 'unhoused'`

`"is currently unhoused[, {LOC_FRAG}]"`

| `unhousedLocation`   | fragment                   |
| -------------------- | -------------------------- |
| `vehicle`            | `living in a vehicle`      |
| `encampment`         | `in an encampment`         |
| `street`             | `on the street`            |
| `abandoned_building` | `in an abandoned building` |
| absent / unknown     | omitted                    |

### 2c. `primaryStatus = 'housed'`

`"is housed[ HOUSED_TYPE_FRAG][ at {temporaryHousingName}][ TEMP_TYPE_FRAG][, DEP_TYPE_FRAG][ at {address}]"`

| `housedType`        | fragment                              |
| ------------------- | ------------------------------------- |
| `renting`           | `in a residence that they rent`       |
| `own`               | `in a residence that they own`        |
| `dependent`         | `and dependent on others for housing` |
| `temporary_housing` | `in temporary housing`                |
| absent / unknown    | omitted                               |

| `temporaryHousingType` | fragment                    |
| ---------------------- | --------------------------- |
| `sober_living`         | `in sober living`           |
| `treatment_program`    | `in a treatment program`    |
| `transitional_program` | `in a transitional program` |
| `shelter`              | `at a shelter`              |
| `hotel_motel`          | `in a hotel/motel`          |

| `dependentHousingType` | fragment                 |
| ---------------------- | ------------------------ |
| `with_family`          | `staying with family`    |
| `with_partner`         | `staying with a partner` |
| `with_friend`          | `staying with a friend`  |

`in temporary housing` is suppressed when a program name or a recognized temporary-housing
type follows it, so the sentence reads `is housed in sober living` rather than
`is housed in temporary housing in sober living`. If the subtype is unrecognized, the
generic phrase stays — otherwise the client would just be `is housed`.

> is housed at Hope Homes, staying with family

### 2d. `primaryStatus` absent or unrecognized

Returns `null` and warns.
