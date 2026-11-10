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

import type { HousingApplicationForm } from "../types/housingApplication";

// Test-only fixture — not exported from the package's public index.ts.
// Import directly via "~@idaho-th/shared/fixtures/housingApplication".
export const DEFAULT_HOUSING_APPLICATION_FORM_VALUES: HousingApplicationForm = {
  cmPoName: "",
  cmPoEmail: "",
  cmPoPhone: "",
  currentFacilityLocation: "",
  clientFullName: "",
  idocNumber: null,
  dob: null,
  age: null,
  ssnLast4: null,
  gender: "",
  personalPhoneNumber: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  legalCurrentStatus: "",
  legalMostRecentConviction: "",
  legalCountyOfCrime: "",
  legalSexOffenderRegistry: null,
  legalBackupForIcOrIce: null,
  childVisitationRequired: null,
  priorInvoluntaryDischarge: null,
  violenceHistoryDors: null,
  housingProbationParoleAtRelease: null,
  tpdHousingNeededDate: null,
  paroleHearingCompleted: null,
  vehicleOnSite: null,
  idsOnFile: [],
  militaryService: null,
  vaEnrolled: null,
  employmentOnRelease: null,
  employer: null,
  employerContact: null,
  medicalMhSupportNeeded: null,
  contagiousDisease: null,
  ssiSsdiSsrbMedicareMedicaid: null,
  benefitsReinstatementDate: null,
  benefitsDuration: null,
  prescribedMedications: "",
  addictions: null,
  substances: "",
  lastUseDate: null,
  underInfluenceAtCrime: null,
  faithBasedPreferred: null,
  previousTransitionalHome: null,
  previousHomeName: "",
  previousHomeCity: null,
  preferredDistrict: [],
  preferredProviders: ["", "", ""],
  signatureProvided: null,
  signatureDate: null,
  accommodations: [],
  otherAccommodations: null,
  accommodationsInfo: null,
  childFamilyServicesDocumentation: [],
  parentGuardianNames: null,
  child1Info: null,
  child2Info: null,
  child3Info: null,
  childVisitationInfo: null,
  violenceDischargeDescription: null,
  medicalAccommodations: [],
  otherMedicalAccommodation: null,
  additionalMedicalInfo: null,
  ssi90DayCarePlan: null,
  faithBasedProviderInfo: null,
};
