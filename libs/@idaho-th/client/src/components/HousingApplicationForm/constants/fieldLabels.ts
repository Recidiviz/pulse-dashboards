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

import type { HousingApplicationFormKeys } from "./fieldKeys";

export const FIELD_LABELS = {
  cmPoName: "CM/PO Name",
  cmEmailOnFile: "CM Email on File",
  cmPoEmail: "CM/PO Contact Email",
  cmPoPhone: "CM/PO Phone Number",
  currentFacilityLocation: "Facility",
  clientFullName: "Full Name",
  idocNumber: "IDOC#",
  dob: "DOB",
  age: "Age",
  ssnLast4: "SSN (last 4)",
  gender: "Gender",
  personalPhoneNumber: "Client Phone Number",
  emergencyContactName: "Emergency Contact Name",
  emergencyContactRelationship: "Relationship",
  emergencyContactPhone: "Emergency Contact Phone",
  legalCurrentStatus: "Current Status",
  legalMostRecentConviction: "Most Recent Conviction",
  legalCountyOfCrime: "County of Crime",
  legalSexOffenderRegistry: "Sex Offender Registry",
  legalBackupForIcOrIce: "Backup for IC or ICE",
  housingProbationParoleAtRelease: "Probation/Parole at Release",
  childVisitationRequired: "Child Visitation Required",
  priorInvoluntaryDischarge: "Prior Involuntary Discharge",
  violenceHistoryDors: "Violence History / DORs",
  tpdHousingNeededDate: "Release Date",
  paroleHearingCompleted: "Parole Hearing Completed",
  vehicleOnSite: "Vehicle on Site",
  idsOnFile: "IDs on File",
  militaryService: "Military Service",
  vaEnrolled: "VA Enrolled",
  employmentOnRelease: "Employment on Release",
  employer: "Employer",
  employerContact: "Employer Contact",
  medicalMhSupportNeeded: "Medical/MH Support Needed",
  contagiousDisease: "Contagious Disease",
  ssiSsdiSsrbMedicareMedicaid: "SSI/SSDI/SSRB/Medicare/Medicaid",
  benefitsReinstatementDate: "Benefits Reinstatement Date",
  benefitsDuration: "Benefits Duration",
  prescribedMedications: "Prescribed Medications",
  addictions: "Addictions",
  substances: "Substances",
  lastUseDate: "Last Use Date",
  underInfluenceAtCrime: "Under Influence at Crime",
  faithBasedPreferred: "Faith-Based Preferred",
  previousTransitionalHome: "Previous Transitional Home",
  previousHomeName: "Previous Transitional Home Name",
  previousHomeCity: "Previous Transitional Home City",
  preferredDistrict: "Preferred District",
  preferredProviders: "Preferred Providers",
  signatureProvided: "Signature Provided",
  signatureDate: "Signature Date",
  accommodations: "Accommodations",
  otherAccommodations: "Other Assistance Needed",
  accommodationsInfo: "Additional Accommodations Info",
  childFamilyServicesDocumentation: "Documentation",
  parentGuardianNames: "Parent/Guardian name(s)",
  child1Info: "Child 1 (name, gender, age, special info)",
  child2Info: "Child 2 (name, gender, age, special info)",
  child3Info: "Child 3 (name, gender, age, special info)",
  childVisitationInfo: "Additional Child/Family Info",
  violenceDischargeDescription: "Violence/Discharge Description",
  medicalAccommodations: "Accommodations",
  otherMedicalAccommodation: "Other Medical Accommodations",
  additionalMedicalInfo: "Additional Medical Info",
  ssi90DayCarePlan: "SSI 90-Day Care Plan",
  faithBasedProviderInfo: "Faith-Based Provider Info",
} satisfies Record<HousingApplicationFormKeys, string>;

export const dobWithAgeLabel = `${FIELD_LABELS.dob} (${FIELD_LABELS.age})`;

export const preferredProviderSlotLabel = (slotIndex: number) =>
  `Preferred Provider ${slotIndex + 1}`;
