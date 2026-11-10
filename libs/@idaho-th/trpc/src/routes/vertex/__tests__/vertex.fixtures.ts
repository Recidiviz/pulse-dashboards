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

import type { HousingApplicationExtractedData } from "~@idaho-th/trpc/routes/vertex/vertex.types";

/**
 * One complete Vertex extraction result. Shared by the mapper suite and the
 * housing-extractor suite, which needs a payload the mapper will accept.
 */
export function buildExtracted(
  overrides: {
    dob?: string | null;
    gender?: string;
    county?: string;
    preferredDistrict?: unknown;
    prescriptionMedication?: boolean | null;
    signatureDate?: string | null;
  } = {},
): HousingApplicationExtractedData {
  return {
    caseManager: {
      cmPoName: "Casey Manager",
      cmPoEmail: null,
      cmPoPhone: null,
      currentFacilityLocation: null,
    },
    clientIdentity: {
      clientFullName: "Jane Doe",
      idocNumber: "12345",
      dob: overrides.dob === undefined ? "1985-01-15" : overrides.dob,
      age: 41,
      ssnLast4: "6789",
      gender: (overrides.gender ?? "Female") as never,
      personalPhoneNumber: null,
      ...(overrides.gender !== undefined ? { genderConfidence: 88 } : {}),
    } as HousingApplicationExtractedData["clientIdentity"],
    emergencyContact: {
      emergencyContactName: null,
      emergencyContactRelationship: null,
      emergencyContactPhone: null,
    },
    legalStatus: {
      legalCurrentStatus: "Termer",
      legalMostRecentConviction: null,
      legalCountyOfCrime: (overrides.county ?? "Ada") as never,
      legalSexOffenderRegistry: false,
      legalBackupForIcOrIce: null,
      childVisitationRequired: null,
      priorInvoluntaryDischarge: null,
      violenceHistoryDors: false,
      housingProbationParoleAtRelease: null,
      tpdHousingNeededDate: "2026-08-01",
      paroleHearingCompleted: null,
      vehicleOnSite: null,
    },
    identification: { idsOnFile: [] },
    military: { militaryService: null, vaEnrolled: null },
    employment: {
      employmentOnRelease: null,
      employer: null,
      employerContact: null,
    },
    medicalSupport: {
      medicalMhSupportNeeded: null,
      contagiousDisease: null,
      prescriptionMedication: overrides.prescriptionMedication ?? true,
      prescriptionMedicationCompany: null,
      assistanceCbrs: null,
      assistanceCbrsCompany: null,
      moudMatProgram: null,
      moudMatProgramCompany: null,
      contagiousDiseaseCompany: null,
      ongoingMedicalMhTreatment: null,
      ongoingMedicalMhTreatmentCompany: null,
      medicalAccommodations: [],
      otherMedicalAccommodation: null,
      additionalMedicalInfo: null,
    },
    benefits: {
      ssiSsdiSsrbMedicareMedicaid: null,
      benefitsReinstatementDate: null,
      benefitsDuration: null,
    },
    substanceUse: {
      prescribedMedications: null,
      addictions: null,
      substances: null,
      lastUseDate: null,
      underInfluenceAtCrime: null,
    },
    housingPreferences: {
      faithBasedPreferred: null,
      previousTransitionalHome: null,
      previousHomeName: null,
      previousHomeCity: null,
      preferredDistrict: (overrides.preferredDistrict ?? ["D3"]) as never,
      preferredProviders: [],
    },
    signature: {
      signatureProvided: true,
      signatureDate:
        overrides.signatureDate === undefined
          ? "2026-05-01"
          : overrides.signatureDate,
    },
    reasonableAccommodations: {
      accommodations: [],
      otherAccommodations: null,
      accommodationsInfo: null,
    },
    childVisitation: {
      childFamilyServicesDocumentation: [],
      parentGuardianNames: null,
      child1Info: null,
      child2Info: null,
      child3Info: null,
      childVisitationInfo: null,
    },
    violenceAndDischarge: { violenceDischargeDescription: null },
    supportPlan: { ssi90DayCarePlan: null, faithBasedProviderInfo: null },
  };
}
