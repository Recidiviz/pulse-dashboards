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

// Canonical shape of the housing application form.
export type HousingApplicationForm = {
  // Server-set, not client-editable.
  cmEmailOnFile?: string | null;

  cmPoName: string;
  cmPoEmail: string | null;
  cmPoPhone: string;

  currentFacilityLocation: string;
  clientFullName: string;
  idocNumber: string | null;
  dob: string | null;
  age: number | null;
  ssnLast4: string | null;
  gender: string | null;
  personalPhoneNumber: string;

  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  legalCurrentStatus: string | null;
  legalMostRecentConviction: string;
  legalCountyOfCrime: string | null;
  legalSexOffenderRegistry: boolean | null;
  legalBackupForIcOrIce: boolean | null;

  childVisitationRequired: boolean | null;
  priorInvoluntaryDischarge: boolean | null;
  violenceHistoryDors: boolean | null;
  housingProbationParoleAtRelease: boolean | null;
  tpdHousingNeededDate: string | null;
  paroleHearingCompleted: boolean | null;
  vehicleOnSite: boolean | null;
  idsOnFile: string[];

  militaryService: boolean | null;
  vaEnrolled: boolean | null;
  employmentOnRelease: boolean | null;

  employer: string | null;
  employerContact: string | null;

  medicalMhSupportNeeded: boolean | null;
  contagiousDisease: boolean | null;

  ssiSsdiSsrbMedicareMedicaid: boolean | null;
  benefitsReinstatementDate: string | null;
  benefitsDuration: string | null;

  prescribedMedications: string | null;
  addictions: boolean | null;
  substances: string | null;
  lastUseDate: string | null;
  underInfluenceAtCrime: boolean | null;

  faithBasedPreferred: boolean | null;
  previousTransitionalHome: boolean | null;
  previousHomeName: string | null;
  previousHomeCity: string | null;
  preferredDistrict: string[];
  /** Provider IDs (UUIDs), never names. */
  preferredProviders: string[];

  signatureProvided: boolean | null;
  signatureDate: string | null;

  accommodations: string[];
  otherAccommodations: string | null;
  accommodationsInfo: string | null;

  childFamilyServicesDocumentation: string[];
  parentGuardianNames: string | null;
  child1Info: string | null;
  child2Info: string | null;
  child3Info: string | null;
  childVisitationInfo: string | null;

  violenceDischargeDescription: string | null;

  medicalAccommodations: string[];
  otherMedicalAccommodation: string | null;
  additionalMedicalInfo: string | null;

  ssi90DayCarePlan: string | null;
  faithBasedProviderInfo: string | null;
};
