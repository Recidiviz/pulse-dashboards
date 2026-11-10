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

import { HousingApplicationForm } from "../types/housingApplication";

export const FIELD_KEYS = {
  cmPoName: "cmPoName",
  cmEmailOnFile: "cmEmailOnFile",
  cmPoEmail: "cmPoEmail",
  cmPoPhone: "cmPoPhone",
  currentFacilityLocation: "currentFacilityLocation",
  clientFullName: "clientFullName",
  idocNumber: "idocNumber",
  dob: "dob",
  age: "age",
  ssnLast4: "ssnLast4",
  gender: "gender",
  personalPhoneNumber: "personalPhoneNumber",
  emergencyContactName: "emergencyContactName",
  emergencyContactRelationship: "emergencyContactRelationship",
  emergencyContactPhone: "emergencyContactPhone",
  legalCurrentStatus: "legalCurrentStatus",
  legalMostRecentConviction: "legalMostRecentConviction",
  legalCountyOfCrime: "legalCountyOfCrime",
  legalSexOffenderRegistry: "legalSexOffenderRegistry",
  legalBackupForIcOrIce: "legalBackupForIcOrIce",
  childVisitationRequired: "childVisitationRequired",
  priorInvoluntaryDischarge: "priorInvoluntaryDischarge",
  violenceHistoryDors: "violenceHistoryDors",
  housingProbationParoleAtRelease: "housingProbationParoleAtRelease",
  tpdHousingNeededDate: "tpdHousingNeededDate",
  paroleHearingCompleted: "paroleHearingCompleted",
  vehicleOnSite: "vehicleOnSite",
  idsOnFile: "idsOnFile",
  militaryService: "militaryService",
  vaEnrolled: "vaEnrolled",
  employmentOnRelease: "employmentOnRelease",
  employer: "employer",
  employerContact: "employerContact",
  medicalMhSupportNeeded: "medicalMhSupportNeeded",
  contagiousDisease: "contagiousDisease",
  ssiSsdiSsrbMedicareMedicaid: "ssiSsdiSsrbMedicareMedicaid",
  benefitsReinstatementDate: "benefitsReinstatementDate",
  benefitsDuration: "benefitsDuration",
  prescribedMedications: "prescribedMedications",
  addictions: "addictions",
  substances: "substances",
  lastUseDate: "lastUseDate",
  underInfluenceAtCrime: "underInfluenceAtCrime",
  faithBasedPreferred: "faithBasedPreferred",
  previousTransitionalHome: "previousTransitionalHome",
  previousHomeName: "previousHomeName",
  previousHomeCity: "previousHomeCity",
  preferredDistrict: "preferredDistrict",
  preferredProviders: "preferredProviders",
  signatureProvided: "signatureProvided",
  signatureDate: "signatureDate",
  accommodations: "accommodations",
  otherAccommodations: "otherAccommodations",
  accommodationsInfo: "accommodationsInfo",
  childFamilyServicesDocumentation: "childFamilyServicesDocumentation",
  parentGuardianNames: "parentGuardianNames",
  child1Info: "child1Info",
  child2Info: "child2Info",
  child3Info: "child3Info",
  childVisitationInfo: "childVisitationInfo",
  violenceDischargeDescription: "violenceDischargeDescription",
  medicalAccommodations: "medicalAccommodations",
  otherMedicalAccommodation: "otherMedicalAccommodation",
  additionalMedicalInfo: "additionalMedicalInfo",
  ssi90DayCarePlan: "ssi90DayCarePlan",
  faithBasedProviderInfo: "faithBasedProviderInfo",
} as const satisfies Record<string, keyof HousingApplicationForm>;

export type HousingApplicationFormKeys =
  (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];
