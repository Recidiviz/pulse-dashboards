TRUNCATE TABLE "public"."AgencyConfig";

INSERT INTO "public"."AgencyConfig" ("id", "version", "parentId", "config")
VALUES
  ('base', 5, NULL, $yaml0$# Base agency config — inherited by all agencies.
# Agency-specific YAMLs override individual fields on top of these defaults.
# This file is not a valid AgencyConfig on its own (no name/stateCode).

version: 5

# ── Infrastructure defaults ──────────────────────────────────
audioTTLDays: 30
transcriptTTLDays: 30
showTranscriptions: true
showCNI: false

# ── LLM defaults ─────────────────────────────────────────────
glossary:
  UA: Urinalysis drug test
  PO: Probation Officer
  IOP: Intensive Outpatient Program

rules:
  - Document all client interactions
  - Note any changes in housing or employment status
  - Record all action items with clear deadlines

outputs:
  - id: case_note
    label: Case Note
    # Drawn from WRITER prompt in libs/@meetings/tasks/src/llm/prompts.ts
    promptGuidance: |
      Write a professional, third-person, objective case note. Open with a quick
      meeting summary, with a "SUMMARY:" header.
      Use CAPS LABELS for sub-topics (e.g. "HOUSING: ...", "EMPLOYMENT: ...").
      Use double line breaks to separate sections. No giant paragraphs.
      Incorporate all points from staff member notes.
      If INTAKE: focus on risk, needs, and initial stability.
      If ROUTINE: focus on changes since last visit and progress.

labels:
  supervisionStaff: Staff
  facilitiesStaff: Staff
  client: Client
  resident: Resident
$yaml0$),
  ('us_az', 2, 'base', $yaml1$name: Arizona
stateCode: US_AZ
version: 2

audioTTLDays: null
transcriptTTLDays: null

additionalKeywords:
  - ADCRR
$yaml1$),
  ('us_co', 4, 'base', $yaml2$name: Colorado
stateCode: US_CO
version: 4

staffFeedbackEnabled: true

additionalKeywords:
  - CDOC
  - Edovo

outputPatches:
  case_note:
    subheaders:
      - Current Housing
      - Recent Policy Contact
      - Treatment
      - Urine Analysis
      - Employment
      - Restitution

meetingTypes:
  - type: Contact
    visible: false
  - type: Collateral Contact
    isCategoryRequired: true
    visible: false
    categories:
      - Family
      - Friend
      - Employer
      - Treatment Provider
      - Legal Counsel
    categoryType: "Relationship"
    promptConfig:
      extractionNote: The client was NOT present for this meeting. The other speaker is a collateral contact (family member, employer, service provider, etc.), not the client. Do not assign action items to a "Client" — assign them to "Third Party" or "Staff Member" only.
      caseNoteGuidance: This is a collateral contact meeting; the client was not present. Document what the contact reported about the client rather than direct client statements.
$yaml2$),
  ('us_demo', 7, 'base', $yaml3$name: Demo
stateCode: US_DEMO
version: 7

audioTTLDays: null
transcriptTTLDays: null
staffFeedbackEnabled: true
audioPlaybackEnabled: true
showCNI: true
meetingTypes:
  - type: Assessment
    visible: true
  - type: Contact
    visible: true
  - type: 120-Day Meeting
    visible: true
  - type: Collateral Contact
    visible: true
    isCategoryRequired: true
    categories:
      - Family
      - Friend
      - Employer
      - Treatment Provider
      - Legal Counsel
    categoryType: "Relationship"
    promptConfig:
      extractionNote: The client was NOT present for this meeting. The other speaker is a collateral contact (family member, employer, service provider, etc.), not the client. Do not assign action items to a "Client" — assign them to "Third Party" or "Staff Member" only.
      caseNoteGuidance: This is a collateral contact meeting; the client was not present. Document what the contact reported about the client rather than direct client statements.
$yaml3$),
  ('us_id', 1, 'base', $yaml4$name: Idaho
stateCode: US_ID
version: 1

additionalKeywords:
  - IDOC
$yaml4$),
  ('us_me', 1, 'base', $yaml5$name: Maine
stateCode: US_ME
version: 1

showTranscriptions: false

additionalKeywords:
  - MDOC
$yaml5$),
  ('us_nc', 4, 'base', $yaml6$name: North Carolina
stateCode: US_NC
version: 4

outputPatches:
  case_note:
    subheaders:
      - Employment
      - Family Situation / Friends & Associates
      - Pro-social behavior
      - Substance Abuse
      - Sex Offender
      - Victim
      - Mental Health
      - Housing / Current Living Situation
      - Financial
      - Academic / Vocational
      - Legal
      - Physical Health
additionalGlossary:
  ADA: American Disabilities Act
  AOC: Administrative Office of the Courts
  CAM: Continuous Alcohol Monitoring
  CBI: Cognitive Behavior Intervention
  CC: Curfew Contact
  CCA: Community Corrections Analyst
  CDS: Community Development Specialist
  CJLEADS: Criminal Justice Law Enforcement Automated Data System
  CJPP: Criminal Justice Partnership Program
  CPAI: Correctional Program Assessment Inventory
  CPPO: Chief Probation and Parole Officer
  CRV: Confinement in Response to Violation
  CSAS: Community Service Automated System
  CSWP: Community Service Work Program
  CTG: Community Threat Group (Gangs - DCC)
  DACDP: Division Alcoholism and Chemical Dependency
  DART: Drug Alcohol Recovery Treatment
  DCC: Community Corrections
  DCI: Division of Criminal Information
  DHHS: Department of Health and Human Services
  DOA: Department of Administration
  DOL: Department of Labor
  DOP: Division of Prisons
  DRC: Day Reporting Center
  DS: Drug Screen
  DTC: Drug Treatment Court
  DV: Domestic Violence
  EAP: Employee Assistance Program
  EBP: Evidence Based Practices
  EHA: Electronic House Arrest
  EM: Electronic Monitoring
  ESC: Employment Security Commission
  FC: Field Contact
  FLSA: Fair Labor Standard Act
  FMS: Financial Management System
  FTA: Failure to Appear
  FTR: Failure to Report
  GPS: Global Positioning System
  HC: Home Contact
  ICOTS: Interstate Compact Offender Tracking System
  IMS: Information Management System
  ISC: Interstate Compact
  JDM: Judicial District Manager
  JSC: Judicial Services Coordinator
  LEP: Limited English Proficient
  LME: Local Management Entity
  MFM: Motor Fleet Management
  MOA: Memorandum of Agreement
  MOU: Memorandum of Understanding
  NCAS: North Carolina Accounting System
  NCAWARE: North Carolina Automated Warrant Repository
  NCIC: National Crime Information Center
  NCPPA: North Carolina Probation Parole Association
  OAR: Offender Accountability Reporting
  OC: Office Contact
  OMC: Offender Management Contact
  OMM: Offender Management Model
  OPUS: Offender Population Unified System (Information Management System for Probation)
  OTI: Offender Traits Inventory (DCC Risk Needs Tool)
  OTS: Office of Transitional Services (DOC - Research and Planning Program)
  PPO/PO: Probation and Parole Officer
  PREA: Prison Rape Elimination Act
  PSI: Pre-sentence Investigation
  QDC: Quick Dip Confinement
  RRS: Recidivism Reduction Services (RRS) programs
  RNA: Risk Needs Assessments (DCC Risk Needs Tools)
  SASP: Substance Abuse Screening Program
  SBI: State Bureau of Investigation
  SBM: Satellite Based Monitoring
  SCR: Serious Crime Report
  SPA: State Personnel Act
  SSA: Satellite Substance Abuse Program
  STG: Serious Threat Group (Gangs - DOP)
  SO: Surveillance Officer
  SOP: Standard Operating Procedure
  SASSI: Substance Abuse Subtle Screening Inventory
  SxOM: Sex Offender Management
  TASC: Treatment Alternative for Safer Communities
  TECSP: Treatment for Effective Community Supervision Program
  TX: Treatment
  VR: Vocational Rehabilitation

meetingTypes:
  - type: Contact
    visible: false
  - type: Collateral Contact
    isCategoryRequired: true
    visible: false
    categories:
      - Family
      - Friend
      - Employer
      - Treatment Provider
      - Legal Counsel
    categoryType: "Relationship"
    promptConfig:
      extractionNote: The client was NOT present for this meeting. The other speaker is a collateral contact (family member, employer, service provider, etc.), not the client. Do not assign action items to a "Client" — assign them to "Third Party" or "Staff Member" only.
      caseNoteGuidance: This is a collateral contact meeting; the client was not present. Document what the contact reported about the client rather than direct client statements.
$yaml6$),
  ('us_nd', 2, 'base', $yaml7$name: North Dakota
stateCode: US_ND
version: 2

staffFeedbackEnabled: true

additionalKeywords:
  - DOCR
$yaml7$),
  ('us_ne', 3, 'base', $yaml8$name: Nebraska
stateCode: US_NE
version: 3

staffFeedbackEnabled: true

additionalKeywords:
  - NDCS
  - Edovo

outputPatches:
  case_note:
    subheaders:
      - Housing
      - Mental Health
      - Substance Use
      - Medical
      - Education
      - Employment
      - Family/Social Support
      - Hobbies/Leisure
      - Transportation
      - Identification
$yaml8$),
  ('us_tn', 2, 'base', $yaml9$name: Tennessee
stateCode: US_TN
version: 2

audioPlaybackEnabled: true
audioTTLDays: null
transcriptTTLDays: null

additionalKeywords:
  - TDOC
$yaml9$)
ON CONFLICT ("id", "version") DO NOTHING;
