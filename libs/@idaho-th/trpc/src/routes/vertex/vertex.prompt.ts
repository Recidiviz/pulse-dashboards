// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

const CONSISTENCY_RULES = `\
- If legalStatus.violenceHistoryDors is true, then violenceAndDischarge.violenceDischargeDescription must not be null.
- If legalStatus.childVisitationRequired is true, then childVisitation must not be null.
- If benefits.ssiSsdiSsrbMedicareMedicaid is true, then supportPlan.ssi90DayCarePlan must not be null.
- If housingPreferences.faithBasedPreferred is true, then supportPlan.faithBasedProviderInfo must not be null.
- If military.militaryService is true, then military.vaEnrolled must be a boolean (not null).
- If military.militaryService is false or null, then military.vaEnrolled must be null.
- If substanceUse.addictions is true, then substanceUse.substances must contain at least one entry.`;

const SYSTEM_PROMPT = `
You are a data extraction engine for handwritten IDOC Housing Application forms (V2.0).
Return one valid JSON object matching the provided schema. No markdown, no code fences, no commentary.

CORE RULES — apply to every field without exception:

[TRANSCRIBE] Handwritten text: copy ink marks exactly, character by character. Do not autocorrect,
substitute visually similar characters, or infer what a value "should" be.

[NULL] A blank field, illegible field, or any variant of "N/A" (including "NA", "na", "n.a.",
"none", "not applicable", "-", "--") → return JSON null. Never return the string "N/A", "NA",
"na", or any equivalent — the output value must always be JSON null, never a string placeholder.

[CHECKBOX] Mark = true (any ink: X, tick, slash, dot). Empty box = false. When ambiguous → true.
  Yes/No fields: inspect YES and NO boxes independently.
  If YES marked → true. If NO marked → false. If NEITHER box is marked → null.
  Multi-select arrays: empty box = excluded. Empty array [] is valid.

[DATE] Return all dates as MM/DD/YYYY. Expand short years: "4/1/26" → "04/01/2026".

[ARRAY] Inspect each option's checkbox independently. Include only marked items in a checkbox
array. An empty array [] is valid. Write-in lists with multiple items → one element per item.
`.trim();

const CONFIDENCE_PROMPT_SECTION = `
[CONFIDENCE] Each field has a paired fieldNameConfidence integer (0–100) reflecting certainty in the extracted value.
  95–100: clear legible text or unambiguous checkbox/blank. 80–90: one character or mark is uncertain; best reading taken.
  60–70: multiple ambiguous characters or faint ink; alternative readings exist. ≤50: heavily degraded; value may be wrong.
  Blank/N/A fields confirmed absent → 100. Arrays: one score for the whole field. Never return 100 for ambiguous handwriting.
`.trim();

export const HOUSING_APPLICATION_USER_PROMPT = `\
Extract all data from the attached IDOC Housing Application and return a single JSON object matching the provided responseSchema.
Work through these steps in order before producing output.

Step 1: Checkboxes
Locate every checkbox in the document. For each Yes/No question, read both the Yes box and the No box independently, then record whichever is marked. For every multi-select group, scan all items across all rows and columns before recording any value. Do not skip items at the edges or in secondary columns.

Step 2: Text fields
For each handwritten text field, transcribe the pen strokes as written. For short critical fields such as email addresses, ID numbers, and phone numbers, read each character individually and record exactly what the strokes form without substitution or correction.

Step 3: Cross-page backfill
For every field that appears in the schema, check whether it is blank in one section but populated in another. If so, use the populated value in the output.

Step 4: Consistency validation
Run the following cross-field rules. Note any violations but do not override extracted values to resolve them.
${CONSISTENCY_RULES}

Step 5: Output
Write the final JSON object only. No other text. No markdown, no code fences, no commentary, no preamble, no trailing text.`;

export const PAGE_1_USER_PROMPT = `\
Extract PAGE 1 of the attached IDOC Housing Application PDF.
Return one JSON object matching the responseSchema. Follow every step in order.

━━━ GLOBAL RULES (apply to every field) ━━━
- NULL FIRST: If a field is blank, illegible, or absent → return null. Never infer, guess, or fabricate.
- DATES: Read each date character by character (MM/DD/YYYY). Expand 2-digit years (e.g. "85" → "1985"). If any part is missing or unreadable → null.
- BOOLEANS: Inspect YES and NO boxes independently. Inked YES → true. Inked NO → false. Neither inked, or ambiguous → null. Never default to false.
- INTEGERS: Read each digit individually. No rounding, substitution, or autocorrect.
- STRINGS: Transcribe exactly as written, then apply field-specific normalisation if specified.

━━━ STEP 1 — Header block ━━━
Read character-by-character from labeled header lines (top-right of page):
  cmPoEmail              → do NOT autocorrect; preserve exact characters
  cmPoPhone              → each digit individually
  currentFacilityLocation

━━━ STEP 2 — Client identity (Q1–Q3) ━━━
Q1:
  clientFullName  → transcribe raw, then apply TITLE CASE:
    • Capitalise first letter of every whitespace-delimited word; lowercase all others.
    • Hyphens are word boundaries: each segment capitalised independently.
      e.g. "MARY-JANE SMITH" → "Mary-Jane Smith"
    • No other transformations (no Mc/Mac/O' special-casing).
  idocNumber      → integer; null if blank
  dob             → MM/DD/YYYY; null if blank or unreadable
  age             → READ FROM FORM ONLY. If the age field is physically written on the form → integer.
                    If the age field is blank or empty → return 0. NEVER calculate or infer age from dob.
                    0 means "not provided", not "zero years old".
  ssnLast4        → 4-digit integer (no dashes); null if blank

Q2:
  gender → "Male" if M checkbox inked | "Female" if F checkbox inked | null if blank N/A or blank → null

Q3:
  personalPhoneNumber → read each digit individually; null if blank N/A or blank → null

━━━ STEP 3 — Emergency contact (Q4–Q5) ━━━
Q4 label: "Emergency Contact Name & Relationship"
  emergencyContactName         → name portion only N/A or blank → null
  emergencyContactRelationship → relationship word(s) physically written after the name only.
                                  If no relationship word is written → null. Never infer. N/A or blank → null
Q5:
  emergencyContactPhone → transcribe exactly; null if blank

━━━ STEP 4 — Legal status (Q6–Q16) ━━━
Inspect each YES/NO pair independently. Neither marked → null.

  Q6   legalCurrentStatus        → checkbox: "Termer" | "Rider" | "Parole Violator" | null
  Q7   legalMostRecentConviction → transcribe exactly; null if blank
  Q8   legalCountyOfCrime        → match to schema enum; null if blank
  Q9   legalSexOffenderRegistry         → true | false | null
  Q10  legalBackupForIcOrIce            → true | false | null
  Q11  childVisitationRequired          → true | false | null
  Q12  priorInvoluntaryDischarge        → true | false | null
  Q13  violenceHistoryDors              → true | false | null
  Q14  housingProbationParoleAtRelease  → true | false | null
  Q15  tpdHousingNeededDate             → MM/DD/YYYY; null if blank
       paroleHearingCompleted           → true | false | null
  Q16  vehicleOnSite                    → true | false | null

━━━ STEP 5 — Identification (Q17) ━━━
Inspect all four checkboxes independently, left to right:
  1. Driver's License  2. State ID  3. Social Security Card  4. Birth Certificate
idsOnFile → array of visibly marked items only. Empty array [] if none marked.

━━━ STEP 6 — Military (Q18) ━━━
Q18 spans TWO physical lines. Treat each line's boxes in complete isolation.

  LINE 1 contains the question text ending in "Y □  N □"
    militaryService → LINE 1 Y inked → true | LINE 1 N inked → false | neither → null

  LINE 2 is indented below with only "Y □  N □" and no question text
    vaEnrolled      → LINE 2 Y inked → true | LINE 2 N inked → false | neither → null

  ⚠ LINE 2 boxes have zero effect on militaryService.
  ⚠ LINE 1 boxes have zero effect on vaEnrolled.

━━━ STEP 7 — Employment (Q19) ━━━
  employmentOnRelease → true | false | null
  employer            → business name written on this page; null if blank
  employerContact     → contact number written on this page; null if blank

━━━ STEP 8 — Final verification checklist ━━━
Before outputting, verify each item:

  □ cmPoEmail         — re-read every character; no autocorrect
  □ dob               — re-read each segment; confirm MM/DD/YYYY format
  □ age — is this value physically written on the form? If not → 0 (never compute from dob)
  □ idocNumber / personalPhoneNumber — re-read each digit; no substitution
  □ emergencyContactRelationship — is a relationship word physically present? If not → null
  □ idsOnFile         — all four Q17 boxes individually inspected; array = marked only
  □ All booleans      — both boxes of every YES/NO pair re-inspected; default is null not false
  □ clientFullName    — title-case rule applied: every word and hyphen-segment starts uppercase
  □ Q18 final check   — re-examine LINE 1 and LINE 2 in isolation:
      militaryService = LINE 1 result only
      vaEnrolled      = LINE 2 result only

Output the JSON object only. No explanation, no markdown.`.trim();

const PREF_PROVIDERS_PROMPT = `
You are matching user-provided organization names to a canonical database list.

RULES:
- Default to null. Only match if you are certain it's the same organization.
- Valid match reasons: clear typo/OCR noise, unambiguous abbreviation, or punctuation difference.
- Strip list markers (e.g., "1.", "(1)", "1-") from input before matching; preserve numbers that are part of the name (e.g., "208 Property Management").
- Prefix rule: if the input matches the start of 1-2 database entries and differs by only 1 extra word, match the shorter entry. If 2+ extra words differ -> null.
  - Example: "Lazarus House" -> matches "Lazarus House: D1" (yes); "Lazarus House Recovery Center" -> null
- Copy the matched value exactly as it appears in the database. Never construct or modify strings.

OUTPUT: Return a JSON array. One matched name per element. No match -> empty string for that element. No inputs -> [].
`.trim();

const PAGE_2_USER_PROMPT_PREFIX = `\
Extract PAGE 2 of the attached IDOC Housing Application PDF.
Return one JSON object matching the responseSchema. Complete every step in order.
 
── STEP 1 · Employment (Q20)
employer        — business name on Q20 line → transcribe · blank → null
employerContact — phone or email on Q20 line → transcribe · blank → null
 
── STEP 2 · Medical flags (Q21–Q22)
medicalMhSupportNeeded — Q21 Y/N (neither marked → null)
contagiousDisease      — Q22 Y/N (neither marked → null)
 
── STEP 3 · Substance use
prescribedMedications — "List any prescribed medications" write-in → string · blank → null
addictions            — Y/N (neither marked → null)
substances            — "Drug(s) of Choice" write-in → transcribe exactly · blank → null
lastUseDate           — "Date of last use" write-in → transcribe exactly · blank → null
underInfluenceAtCrime — "Under the influence at time of crime?" Y/N (neither marked → null)
 
── STEP 4 · Benefits
ssiSsdiSsrbMedicareMedicaid — Y/N (neither marked → null)
benefitsReinstatementDate   — reinstatement date write-in → transcribe exactly · N/A or blank → null
benefitsDuration            — "How long did you receive benefits?" write-in → string · blank → null
 
── STEP 5 · Housing preferences (Q27–Q30)
Q27  faithBasedPreferred      Y/N (neither marked → null)
Q28  previousTransitionalHome Y/N (neither marked → null)
     If true → split "Name, City" write-in: previousHomeName · previousHomeCity
     If false or blank → previousHomeName = null · previousHomeCity = null
Q29  preferredDistrict — inspect D1–D7 checkboxes independently, left to right.
     Return all marked as array of strings e.g. ["D1"]. One expected; include all marked.
Q30  preferredProviders — ${PREF_PROVIDERS_PROMPT}

Canonical provider names (use exact spelling when matching):
`.trim();

const PAGE_2_USER_PROMPT_SUFFIX = `
 
── STEP 6 · Signature
signatureProvided — true if any ink mark in signature box · false if completely blank
signatureDate     — Date write-in next to signature box → MM/DD/YYYY · blank → null
 
── STEP 7 · Case manager name (Q31)
cmPoName — "My case manager or PO's name is:" write-in → transcribe exactly · blank → null
Returns under caseManager.cmPoName.
 
── STEP 8 · Verify before output
□ All booleans — YES=true, NO=false, neither marked=null; both boxes inspected per question
□ preferredDistrict — all D1–D7 boxes individually inspected; array = marked items only
□ preferredProviders — each provider on a separate line is a separate array element
□ previousHomeName / previousHomeCity — correctly split if written on one line
□ All dates — MM/DD/YYYY, short years expanded
 
Output the JSON object. Nothing else.`.trim();

export const PAGE_3_USER_PROMPT = `
Extract PAGE 3 of the attached IDOC Housing Application PDF.
Return one JSON object matching the responseSchema. Complete every step in order.
 
── STEP 1 · Client identity
idocNumber — locate the field explicitly labeled "IDOC#" on PAGE 3 ONLY; read each digit
individually, left to right, combine into a single integer; if blank or absent on this page
return null. Never infer or guess this value.
 
── STEP 2 · Reasonable accommodations (Q2)
Q2 contains a checkbox grid with two columns. Inspect every checkbox independently, left column
then right column, top to bottom.
accommodations    — include only visibly marked items as strings · empty array [] if none marked
otherAccommodations — "Other" checkbox marked? → transcribe the write-in text next to it · unmarked or blank → null
accommodationsInfo  — "Additional information" write-in line → transcribe exactly · blank → null
 
── STEP 3 · Child visitation (Q3) 
Q3 has three documentation checkboxes — inspect each independently:
  Order of Guardianship · Supervision Order · Custody Agreement
childFamilyServicesDocumentation — array of marked checkbox labels · empty array [] if none marked
parentGuardianNames — "Parent's/Guardian's Name" write-in → transcribe exactly · blank → null
child1Info          — child 1 full line (name, gender, age, special info) → transcribe as-is · blank → null
child2Info          — child 2 full line → transcribe as-is · blank → null
child3Info          — child 3 full line → transcribe as-is · blank → null
childVisitationInfo — "Additional Information" write-in at bottom of Q3 → transcribe exactly · blank → null
 
── STEP 4 · Violence and discharge (Q4)
violenceDischargeDescription — transcribe all handwritten lines exactly as written.
  Join multiple lines with a single space. Preserve all misspellings and abbreviations.
  Do not summarize, paraphrase, or omit any sentence · blank → null
 
── STEP 5 · Verify before output
□ idocNumber — confirm it was physically present and labeled "IDOC#" on PAGE 3; if not, null
□ accommodations — every checkbox in both columns inspected; array = marked labels only
□ childFamilyServicesDocumentation — all three boxes inspected; array = marked labels only
□ child1Info / child2Info / child3Info — full line captured per child; blank line → null
□ violenceDischargeDescription — all lines joined; nothing truncated or paraphrased
□ All write-ins — transcribed exactly; no autocorrect; blank → null
 
Output the JSON object. Nothing else.
`.trim();

export const PAGE_4_USER_PROMPT = `
Extract PAGE 4 of the attached IDOC Housing Application PDF.
Return one JSON object matching the responseSchema. Complete every step in order.
 
── STEP 1 · Medical support checkbox grid (Q5)
Q5 is a two-column grid: left = checkbox, right = "Company:" write-in.
Inspect each row’s checkbox independently (mark = true, empty = false):
  Row 1  prescriptionMedication        Y/N · prescriptionMedicationCompany    — "Company:" write-in → transcribe · blank → null
  Row 2  assistanceCbrs                Y/N · assistanceCbrsCompany            — "Company:" write-in → transcribe · blank → null
  Row 3  moudMatProgram                Y/N · moudMatProgramCompany            — "Company:" write-in → transcribe · blank → null
  Row 4  contagiousDisease             Y/N · contagiousDiseaseCompany         — "Company:" write-in → transcribe · blank → null
  Row 5  ongoingMedicalMhTreatment     Y/N · ongoingMedicalMhTreatmentCompany — "Company:" write-in → transcribe · blank → null
  Row 6  "Other:" write-in → otherMedicalAccommodation — transcribe · blank → null
 
── STEP 2 · Additional medical information 
additionalMedicalInfo — "Additional Information" free-text block below the Q5 grid.
  Transcribe all lines exactly as written, joining multiple lines with a single space · N/A or blank → null
 
── STEP 3 · SSI 90-day care plan (Q6)
ssi90DayCarePlan — transcribe all handwritten lines, join with a single space · N/A or blank → null
 
── STEP 4 · Faith-based provider (Q7)
faithBasedProviderInfo — transcribe all handwritten lines, join with a single space · N/A or blank → null
 
── STEP 5 · Verify before output
□ Q5 grid — all 6 rows inspected; checkbox boolean + company write-in captured per row
□ additionalMedicalInfo — all lines joined; not truncated; N/A or blank → null
□ ssi90DayCarePlan / faithBasedProviderInfo — full text captured; N/A or blank → null
□ All write-ins — transcribed exactly; no autocorrect
 
Output the JSON object. Nothing else.
`.trim();

function formatCanonicalProviderList(providerNames: readonly string[]): string {
  return providerNames.map((name) => `- ${name}`).join("\n");
}

export function buildPage2UserPrompt(providerNames: readonly string[]): string {
  return `${PAGE_2_USER_PROMPT_PREFIX}\n${formatCanonicalProviderList(providerNames)}\n${PAGE_2_USER_PROMPT_SUFFIX}`;
}

export function buildHousingApplicationPageUserPrompts(
  providerNames: readonly string[],
): readonly [string, string, string, string] {
  return [
    PAGE_1_USER_PROMPT,
    buildPage2UserPrompt(providerNames),
    PAGE_3_USER_PROMPT,
    PAGE_4_USER_PROMPT,
  ];
}

export function buildSystemPrompt(includeConfidence: boolean): string {
  if (!includeConfidence) {
    return SYSTEM_PROMPT;
  }
  return `${SYSTEM_PROMPT}\n\n${CONFIDENCE_PROMPT_SECTION}`;
}
