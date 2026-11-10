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
import { FIELD_LABELS } from "./fieldLabels";

export const paperFormDobWithAgeLabel = `${FIELD_LABELS.dob} (${FIELD_LABELS.age}) (Q1)`;

/**
 * Field labels for the intake wizard (Page1-4) and the digitized application
 * view, suffixed with the question number from the paper IDOC Housing
 * Application so a CM can match each field to the PDF shown alongside the
 * form. `(Q#N)` marks a question on the separate "Additional Information
 * Form" (pages 3-4), mirroring how the paper form itself cross-references
 * that form. A field with no corresponding numbered question on the paper
 * form uses its plain label with no suffix.
 */
export const PAPER_FORM_FIELD_LABELS: Record<
  HousingApplicationFormKeys,
  string
> = {
  ...FIELD_LABELS,

  // Page 1
  clientFullName: `${FIELD_LABELS.clientFullName} (Q1)`,
  idocNumber: `${FIELD_LABELS.idocNumber} (Q1)`,
  dob: `${FIELD_LABELS.dob} (Q1)`,
  age: `${FIELD_LABELS.age} (Q1)`,
  ssnLast4: `${FIELD_LABELS.ssnLast4} (Q1)`,
  gender: `${FIELD_LABELS.gender} (Q2)`,
  personalPhoneNumber: `${FIELD_LABELS.personalPhoneNumber} (Q3)`,
  emergencyContactName: `${FIELD_LABELS.emergencyContactName} (Q4)`,
  emergencyContactRelationship: `${FIELD_LABELS.emergencyContactRelationship} (Q4)`,
  emergencyContactPhone: `${FIELD_LABELS.emergencyContactPhone} (Q5)`,
  legalCurrentStatus: `${FIELD_LABELS.legalCurrentStatus} (Q6)`,
  legalMostRecentConviction: `${FIELD_LABELS.legalMostRecentConviction} (Q7)`,
  legalCountyOfCrime: `${FIELD_LABELS.legalCountyOfCrime} (Q8)`,
  legalSexOffenderRegistry: `${FIELD_LABELS.legalSexOffenderRegistry} (Q9)`,
  legalBackupForIcOrIce: `${FIELD_LABELS.legalBackupForIcOrIce} (Q10)`,
  childVisitationRequired: `${FIELD_LABELS.childVisitationRequired} (Q11)`,
  priorInvoluntaryDischarge: `${FIELD_LABELS.priorInvoluntaryDischarge} (Q12)`,
  violenceHistoryDors: `${FIELD_LABELS.violenceHistoryDors} (Q13)`,
  housingProbationParoleAtRelease: `${FIELD_LABELS.housingProbationParoleAtRelease} (Q14)`,
  tpdHousingNeededDate: `${FIELD_LABELS.tpdHousingNeededDate} (Q15)`,
  paroleHearingCompleted: `${FIELD_LABELS.paroleHearingCompleted} (Q15)`,
  vehicleOnSite: `${FIELD_LABELS.vehicleOnSite} (Q16)`,
  idsOnFile: `${FIELD_LABELS.idsOnFile} (Q17)`,
  militaryService: `${FIELD_LABELS.militaryService} (Q18)`,
  vaEnrolled: `${FIELD_LABELS.vaEnrolled} (Q18)`,
  employmentOnRelease: `${FIELD_LABELS.employmentOnRelease} (Q19)`,
  cmPoEmail: FIELD_LABELS.cmPoEmail,
  cmPoPhone: FIELD_LABELS.cmPoPhone,
  currentFacilityLocation: FIELD_LABELS.currentFacilityLocation,

  // Page 2
  employer: `${FIELD_LABELS.employer} (Q20)`,
  employerContact: `${FIELD_LABELS.employerContact} (Q20)`,
  medicalMhSupportNeeded: `${FIELD_LABELS.medicalMhSupportNeeded} (Q21)`,
  contagiousDisease: `${FIELD_LABELS.contagiousDisease} (Q22)`,
  ssiSsdiSsrbMedicareMedicaid: `${FIELD_LABELS.ssiSsdiSsrbMedicareMedicaid} (Q23)`,
  benefitsReinstatementDate: `${FIELD_LABELS.benefitsReinstatementDate} (Q23)`,
  benefitsDuration: `${FIELD_LABELS.benefitsDuration} (Q23)`,
  prescribedMedications: `${FIELD_LABELS.prescribedMedications} (Q24)`,
  addictions: `${FIELD_LABELS.addictions} (Q25)`,
  substances: `${FIELD_LABELS.substances} (Q25)`,
  lastUseDate: `${FIELD_LABELS.lastUseDate} (Q25)`,
  underInfluenceAtCrime: `${FIELD_LABELS.underInfluenceAtCrime} (Q26)`,
  faithBasedPreferred: `${FIELD_LABELS.faithBasedPreferred} (Q27)`,
  previousTransitionalHome: `${FIELD_LABELS.previousTransitionalHome} (Q28)`,
  previousHomeName: `${FIELD_LABELS.previousHomeName} (Q28)`,
  previousHomeCity: `${FIELD_LABELS.previousHomeCity} (Q28)`,
  preferredDistrict: `${FIELD_LABELS.preferredDistrict} (Q29)`,
  preferredProviders: `${FIELD_LABELS.preferredProviders} (Q30)`,
  cmPoName: `${FIELD_LABELS.cmPoName} (Q31)`,
  signatureProvided: `${FIELD_LABELS.signatureProvided} (Q31)`,
  signatureDate: `${FIELD_LABELS.signatureDate} (Q31)`,

  // Page 3-4: Additional Information Form (its own Q#1-7)
  accommodations: `${FIELD_LABELS.accommodations} (Q#2)`,
  otherAccommodations: `${FIELD_LABELS.otherAccommodations} (Q#2)`,
  accommodationsInfo: `${FIELD_LABELS.accommodationsInfo} (Q#2)`,
  childFamilyServicesDocumentation: `${FIELD_LABELS.childFamilyServicesDocumentation} (Q#3)`,
  parentGuardianNames: `${FIELD_LABELS.parentGuardianNames} (Q#3)`,
  child1Info: `${FIELD_LABELS.child1Info} (Q#3)`,
  child2Info: `${FIELD_LABELS.child2Info} (Q#3)`,
  child3Info: `${FIELD_LABELS.child3Info} (Q#3)`,
  childVisitationInfo: `${FIELD_LABELS.childVisitationInfo} (Q#3)`,
  violenceDischargeDescription: `${FIELD_LABELS.violenceDischargeDescription} (Q#4)`,
  medicalAccommodations: `${FIELD_LABELS.medicalAccommodations} (Q#5)`,
  otherMedicalAccommodation: `${FIELD_LABELS.otherMedicalAccommodation} (Q#5)`,
  additionalMedicalInfo: `${FIELD_LABELS.additionalMedicalInfo} (Q#5)`,
  ssi90DayCarePlan: `${FIELD_LABELS.ssi90DayCarePlan} (Q#6)`,
  faithBasedProviderInfo: `${FIELD_LABELS.faithBasedProviderInfo} (Q#7)`,
};

export const paperFormPreferredProviderSlotLabel = (slotIndex: number) =>
  `Preferred Provider ${slotIndex + 1} (Q30)`;
