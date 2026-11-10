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

import { z } from "zod";

import { dropNoneWhenMixed } from "~@idaho-th/shared";

const SHORT_TEXT_MAX = 500;
const LONG_TEXT_MAX = 10_000;
const shortText = () => z.string().max(SHORT_TEXT_MAX);
const longText = () => z.string().max(LONG_TEXT_MAX);
const stringArray = () => z.array(shortText()).max(50);

export const PREFERRED_PROVIDERS_MAX = 3;

// preferredProviders is an array of provider IDs (UUIDs), never names. Empty
// slots (the form pads to 3 for display) are stripped here, at the boundary,
// so correctness never depends on the client doing the same; an ID with no
// matching provider is rejected by the PreferredHousingProvider foreign key
// when the save writes it.
const preferredProviders = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value.filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0,
        )
      : value,
  z
    .array(z.string().uuid())
    .max(PREFERRED_PROVIDERS_MAX)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Preferred providers must not contain duplicates",
    }),
);

export const housingApplicationFormSchema = z.object({
  // Personal info
  cmEmailOnFile: shortText().nullable().optional(),
  cmPoName: shortText().nullable(),
  cmPoEmail: shortText().nullable(),
  cmPoPhone: shortText().nullable(),

  // Client information
  currentFacilityLocation: shortText().nullable(),
  clientFullName: shortText().nullable(),
  idocNumber: shortText().nullable(),
  dob: shortText().nullable(),
  age: z.number().nullable(),
  ssnLast4: shortText().nullable(),
  gender: shortText().nullable(),
  personalPhoneNumber: shortText().nullable(),

  // Emergency contact
  emergencyContactName: shortText().nullable(),
  emergencyContactRelationship: shortText().nullable(),
  emergencyContactPhone: shortText().nullable(),

  // Legal status
  legalCurrentStatus: shortText().nullable(),
  legalMostRecentConviction: shortText().nullable(),
  legalCountyOfCrime: shortText().nullable(),
  legalSexOffenderRegistry: z.boolean().nullable(),
  legalBackupForIcOrIce: z.boolean().nullable(),

  // Housing requirements
  childVisitationRequired: z.boolean().nullable(),
  priorInvoluntaryDischarge: z.boolean().nullable(),
  violenceHistoryDors: z.boolean().nullable(),
  housingProbationParoleAtRelease: z.boolean().nullable(),
  tpdHousingNeededDate: shortText().nullable(),
  paroleHearingCompleted: z.boolean().nullable(),
  vehicleOnSite: z.boolean().nullable(),
  idsOnFile: stringArray(),

  // Employment & military
  militaryService: z.boolean().nullable(),
  vaEnrolled: z.boolean().nullable(),
  employmentOnRelease: z.boolean().nullable(),

  // Page 2: Employment
  employer: shortText().nullable(),
  employerContact: shortText().nullable(),

  // Page 2: Medical info
  medicalMhSupportNeeded: z.boolean().nullable(),
  contagiousDisease: z.boolean().nullable(),

  // Page 2: Financial info
  ssiSsdiSsrbMedicareMedicaid: z.boolean().nullable(),
  benefitsReinstatementDate: shortText().nullable(),
  benefitsDuration: shortText().nullable(),

  // Page 2: Substance use
  prescribedMedications: longText().nullable(),
  addictions: z.boolean().nullable(),
  substances: longText().nullable(),
  lastUseDate: shortText().nullable(),
  underInfluenceAtCrime: z.boolean().nullable(),

  // Page 2: Preferences
  faithBasedPreferred: z.boolean().nullable(),
  previousTransitionalHome: z.boolean().nullable(),
  previousHomeName: shortText().nullable(),
  previousHomeCity: shortText().nullable(),
  preferredDistrict: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      const trimmed = v.trim();
      return trimmed.length === 0 ? [] : [trimmed];
    }
    return v;
  }, stringArray()),
  preferredProviders,

  // Page 2: Signature
  signatureProvided: z.boolean().nullable(),
  signatureDate: shortText().nullable(),

  // Page 3: Assistance accommodations
  accommodations: stringArray().default([]),
  otherAccommodations: longText().nullable().default(null),
  accommodationsInfo: longText().nullable().default(null),

  // Page 3: Child / family services
  childFamilyServicesDocumentation: stringArray()
    .transform(dropNoneWhenMixed)
    .default([]),
  parentGuardianNames: longText().nullable().default(null),
  child1Info: longText().nullable().default(null),
  child2Info: longText().nullable().default(null),
  child3Info: longText().nullable().default(null),
  childVisitationInfo: longText().nullable().default(null),

  // Page 3: Additional info
  violenceDischargeDescription: longText().nullable().optional(),

  // Page 4: Medical accommodations
  medicalAccommodations: stringArray().default([]),
  otherMedicalAccommodation: longText().nullable().default(null),
  additionalMedicalInfo: longText().nullable().default(null),

  // Page 4: Additional info
  ssi90DayCarePlan: longText().nullable().default(null),
  faithBasedProviderInfo: longText().nullable().default(null),
});
