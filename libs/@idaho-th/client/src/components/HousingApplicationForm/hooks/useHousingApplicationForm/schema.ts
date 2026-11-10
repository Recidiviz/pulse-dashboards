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
import { type ZodObject, type ZodTypeAny } from "zod";

import { isPhoneValid } from "~@idaho-th/shared";

import {
  ACCOMMODATIONS_OPTIONS,
  CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS,
  COUNTY_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  DISTRICT_OPTIONS,
  FIELD_LABELS,
  GENDER_OPTIONS,
  IDS_ON_FILE_OPTIONS,
  MEDICAL_ACCOMMODATIONS_OPTIONS,
} from "../../constants";
import { isDateValid } from "./utils";

export const trimmedString = z.string().trim();
export const trimmedStringNullable = trimmedString.nullable();

export const isPhoneNumberValid = (label: string) =>
  trimmedString.refine((v) => {
    if (v === "") return true;
    return isPhoneValid(v);
  }, `${label} must be a valid phone number`);

const emptyStringToNull = (v: unknown) => (v === "" ? null : v);

export const yesNoOptional = z.boolean().nullable();
export const genderOptional = z.preprocess(
  emptyStringToNull,
  z.enum(GENDER_OPTIONS).nullable(),
);
export const countyOptional = z.preprocess(
  emptyStringToNull,
  z.enum(COUNTY_OPTIONS).nullable(),
);

const REQUIRED = "Required";

export const districtMultiSelectRequired = z
  .array(z.enum(DISTRICT_OPTIONS))
  .min(1, REQUIRED);

export const nonEmpty = (label: string) =>
  trimmedString.min(1, `${label} is required`);
const IDOC_FORMAT = /^\d{5,7}$/;
const INTEGER_FORMAT = /^\d+$/;
const SSN_LAST4_FORMAT = /^\d{4}$/;

export const housingApplicationSchema = z.object({
  cmPoName: trimmedString,
  cmPoEmail: trimmedString.pipe(
    z.string().email("Invalid email address").or(z.literal("")),
  ),
  cmPoPhone: isPhoneNumberValid(FIELD_LABELS.cmPoPhone),

  currentFacilityLocation: trimmedString,
  clientFullName: nonEmpty(FIELD_LABELS.clientFullName),
  idocNumber: z.preprocess(
    emptyStringToNull,
    trimmedStringNullable
      .refine((v) => v !== null, REQUIRED)
      .refine(
        (v) => v !== null && IDOC_FORMAT.test(v),
        `${FIELD_LABELS.idocNumber} must be 5-7 numeric digits`,
      ),
  ),
  dob: trimmedStringNullable
    .refine((v) => v !== null, REQUIRED)
    .refine(
      (v) => v !== null && isDateValid(v),
      `${FIELD_LABELS.dob} must be a valid month/day/year`,
    ),
  age: z
    .number()
    .int()
    .nullable()
    .refine(
      (v) => v === null || INTEGER_FORMAT.test(String(v)),
      "Age must be an integer",
    ),
  ssnLast4: z.preprocess(
    emptyStringToNull,
    trimmedStringNullable.refine(
      (v) => v === null || SSN_LAST4_FORMAT.test(v),
      `${FIELD_LABELS.ssnLast4} must be exactly 4 numeric digits`,
    ),
  ),
  gender: genderOptional,
  personalPhoneNumber: isPhoneNumberValid(FIELD_LABELS.personalPhoneNumber),

  emergencyContactName: trimmedString,
  emergencyContactRelationship: trimmedString,
  emergencyContactPhone: isPhoneNumberValid(FIELD_LABELS.emergencyContactPhone),

  // Q6 picks the release flow (Rider vs Termer/PV), so it is required.
  legalCurrentStatus: z.preprocess(
    emptyStringToNull,
    z
      .enum(CURRENT_STATUS_OPTIONS)
      .nullable()
      .refine((v) => v !== null, REQUIRED),
  ),
  legalMostRecentConviction: trimmedString,
  legalCountyOfCrime: countyOptional,
  legalSexOffenderRegistry: yesNoOptional,
  legalBackupForIcOrIce: yesNoOptional,

  // Housing requirements
  childVisitationRequired: yesNoOptional,
  priorInvoluntaryDischarge: yesNoOptional,
  violenceHistoryDors: yesNoOptional,
  housingProbationParoleAtRelease: yesNoOptional,
  tpdHousingNeededDate: trimmedStringNullable
    .refine((v) => v !== null, REQUIRED)
    .refine(
      (v) => v !== null && isDateValid(v),
      `${FIELD_LABELS.tpdHousingNeededDate} must be a valid month/day/year`,
    ),
  paroleHearingCompleted: yesNoOptional,
  vehicleOnSite: yesNoOptional,
  idsOnFile: z.array(z.enum(IDS_ON_FILE_OPTIONS)).default([]),

  // Employment & military
  militaryService: yesNoOptional,
  vaEnrolled: yesNoOptional,
  employmentOnRelease: yesNoOptional,

  // Page 2: Employment
  employer: trimmedStringNullable,
  employerContact: trimmedStringNullable,

  // Page 2: Medical info
  medicalMhSupportNeeded: yesNoOptional,
  contagiousDisease: yesNoOptional,

  // Page 2: Financial info
  ssiSsdiSsrbMedicareMedicaid: yesNoOptional,
  benefitsReinstatementDate: trimmedStringNullable,
  benefitsDuration: trimmedStringNullable,

  // Page 2: Substance use
  prescribedMedications: trimmedStringNullable,
  addictions: yesNoOptional,
  substances: trimmedStringNullable,
  lastUseDate: trimmedStringNullable,
  underInfluenceAtCrime: yesNoOptional,

  // Page 2: Preferences
  faithBasedPreferred: yesNoOptional,
  previousTransitionalHome: yesNoOptional,
  previousHomeName: trimmedStringNullable,
  previousHomeCity: trimmedStringNullable,
  preferredDistrict: districtMultiSelectRequired,
  preferredProviders: z.array(trimmedString).default([]),

  // Page 2: Signature
  signatureProvided: z
    .boolean()
    .nullable()
    .refine((v) => v !== null, REQUIRED),
  signatureDate: trimmedStringNullable
    .refine((v) => v !== null, REQUIRED)
    .refine(
      (v) => v !== null && isDateValid(v),
      `${FIELD_LABELS.signatureDate} must be a valid month/day/year`,
    ),

  // Page 3: Assistance accommodations
  accommodations: z.array(z.enum(ACCOMMODATIONS_OPTIONS)).default([]),
  otherAccommodations: trimmedStringNullable,
  accommodationsInfo: trimmedStringNullable,

  // Page 3: Child / family services
  childFamilyServicesDocumentation: z
    .array(z.enum(CHILD_FAMILY_SERVICES_DOCUMENTATION_OPTIONS))
    .default([]),
  parentGuardianNames: trimmedStringNullable,
  child1Info: trimmedStringNullable,
  child2Info: trimmedStringNullable,
  child3Info: trimmedStringNullable,
  childVisitationInfo: trimmedStringNullable,

  // Page 3: Additional info
  violenceDischargeDescription: trimmedStringNullable,

  // Page 4: Medical accommodations
  medicalAccommodations: z
    .array(z.enum(MEDICAL_ACCOMMODATIONS_OPTIONS))
    .default([]),
  otherMedicalAccommodation: trimmedStringNullable,
  additionalMedicalInfo: trimmedStringNullable,

  // Page 4: Additional info
  ssi90DayCarePlan: trimmedStringNullable,
  faithBasedProviderInfo: trimmedStringNullable,
});

export const STEP_VALIDATION_SCHEMA: Record<
  number,
  ZodObject<Record<string, ZodTypeAny>>
> = {
  1: housingApplicationSchema.pick({
    clientFullName: true,
    idocNumber: true,
    dob: true,
    legalCurrentStatus: true,
    tpdHousingNeededDate: true,
  }),
  2: housingApplicationSchema.pick({
    signatureProvided: true,
    signatureDate: true,
    preferredDistrict: true,
  }),
};
