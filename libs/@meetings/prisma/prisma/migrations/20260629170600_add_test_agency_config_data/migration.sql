INSERT INTO "public"."AgencyConfig" ("id", "version", "parentId", "config")
VALUES
  (
    'test_base',
    1,
    NULL,
    $$# Test base agency config — inherited by test agencies.
# Agency-specific configs override individual fields on top of these defaults.
# This config is not a valid AgencyConfig on its own (no name/stateCode).

version: 1

audioTTLDays: 30
transcriptTTLDays: 30
showTranscriptions: true
staffFeedbackEnabled: false
audioPlaybackEnabled: false

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
    promptGuidance: Write a professional, third-person, objective case note.$$
  ),
  (
    'test_agency',
    1,
    'test_base',
    $$name: Test Agency
stateCode: US_DEMO
version: 1

audioTTLDays: null
transcriptTTLDays: null
staffFeedbackEnabled: true
audioPlaybackEnabled: true

meetingTypes:
  - type: Assessment
  - type: Contact
  - type: 120-Day Meeting
  - type: Collateral Contact
    isCategoryRequired: true
    categories:
      - Family
      - Friend
      - Employer
      - Treatment Provider
      - Legal Counsel
    categoryType: "Relationship"

additionalKeywords:
  - supervision
  - reentry

outputPatches:
  case_note:
    subheaders:
      - Housing
      - Employment$$
  );
