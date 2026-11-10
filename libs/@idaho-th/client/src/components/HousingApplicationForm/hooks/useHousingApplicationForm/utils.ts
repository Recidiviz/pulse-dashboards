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

import { isPastBusinessDay } from "~@idaho-th/shared";

import { FIELD_KEYS } from "../../constants/fieldKeys";
import { Field, HousingApplicationForm } from "../../types";
import { digitsOnly, formatPhone } from "../../utils/inputFormatters";
import { InputChangeOptions } from "./types";

export {
  normalizeDefaultValues,
  normalizeExtractedPhoneFields,
} from "~@idaho-th/shared";

const SLASH_US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_HISTORICAL_DATE_MS = dateToDayMs(new Date(1925, 0, 1));
const MIN_SIGNATURE_DATE_MS = dateToDayMs(new Date(2026, 0, 1));

type DateParts = { yyyy: number; mm: number; dd: number };

function dateToDayMs(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function parseFormDateParts(v: string): DateParts | null {
  const trimmed = v.trim();
  const slash = SLASH_US_DATE.exec(trimmed);
  if (slash) {
    return {
      mm: Number(slash[1]),
      dd: Number(slash[2]),
      yyyy: Number(slash[3]),
    };
  }
  const iso = ISO_DATE.exec(trimmed);
  if (iso) {
    return {
      yyyy: Number(iso[1]),
      mm: Number(iso[2]),
      dd: Number(iso[3]),
    };
  }
  return null;
}

function isRealCalendarDate({ yyyy, mm, dd }: DateParts): boolean {
  if (mm < 1 || mm > 12) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return (
    d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd
  );
}

function formDateToDayMs(v: string | null): number | null {
  if (!v) return null;
  const parts = parseFormDateParts(v);
  if (!parts || !isRealCalendarDate(parts)) return null;
  return dateToDayMs(new Date(parts.yyyy, parts.mm - 1, parts.dd));
}

/** `yyyy-MM-dd`, the shape the shared business-day comparison expects. */
function formDateToCalendarDay(v: string | null): string | null {
  if (!v) return null;
  const parts = parseFormDateParts(v);
  if (!parts || !isRealCalendarDate(parts)) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.yyyy}-${pad(parts.mm)}-${pad(parts.dd)}`;
}

export const DEFAULT_FORM_VALUES: HousingApplicationForm = {
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

export type HousingApplicationField = keyof HousingApplicationForm;

export const BLOCKING_FIELDS: HousingApplicationField[] = [
  FIELD_KEYS.clientFullName,
  FIELD_KEYS.idocNumber,
  FIELD_KEYS.dob,
  FIELD_KEYS.legalCurrentStatus,
  FIELD_KEYS.tpdHousingNeededDate,
  // Page 2 blocking fields
  FIELD_KEYS.preferredDistrict,
  FIELD_KEYS.signatureProvided,
  FIELD_KEYS.signatureDate,
];

export const WARN_IF_EMPTY_FIELDS = [
  FIELD_KEYS.cmPoName,
  FIELD_KEYS.cmPoEmail,
  FIELD_KEYS.cmPoPhone,
  FIELD_KEYS.currentFacilityLocation,
  FIELD_KEYS.age,
  FIELD_KEYS.ssnLast4,
  FIELD_KEYS.gender,
  FIELD_KEYS.personalPhoneNumber,
  FIELD_KEYS.emergencyContactName,
  FIELD_KEYS.emergencyContactRelationship,
  FIELD_KEYS.emergencyContactPhone,
  FIELD_KEYS.legalMostRecentConviction,
  FIELD_KEYS.legalCountyOfCrime,
  FIELD_KEYS.legalSexOffenderRegistry,
  FIELD_KEYS.legalBackupForIcOrIce,
  FIELD_KEYS.childVisitationRequired,
  FIELD_KEYS.priorInvoluntaryDischarge,
  FIELD_KEYS.violenceHistoryDors,
  FIELD_KEYS.housingProbationParoleAtRelease,
  FIELD_KEYS.paroleHearingCompleted,
  FIELD_KEYS.vehicleOnSite,
  FIELD_KEYS.idsOnFile,
  FIELD_KEYS.militaryService,
  FIELD_KEYS.employmentOnRelease,

  // Page 2 fields
  FIELD_KEYS.medicalMhSupportNeeded,
  FIELD_KEYS.contagiousDisease,
  FIELD_KEYS.ssiSsdiSsrbMedicareMedicaid,
  FIELD_KEYS.addictions,
  FIELD_KEYS.underInfluenceAtCrime,
  FIELD_KEYS.faithBasedPreferred,
  FIELD_KEYS.previousTransitionalHome,
] as const satisfies readonly HousingApplicationField[];

export const isDateValid = (v: string) => {
  if (v === "") return false;
  const parts = parseFormDateParts(v);
  return parts !== null && isRealCalendarDate(parts);
};

export const getErrorForField = (
  errors: unknown,
  fieldName: string,
): string | undefined => {
  const first = Array.isArray(errors) ? errors[0] : undefined;
  if (!first || typeof first !== "object") return undefined;
  const record = first as Record<string, unknown>;
  const messages = record[fieldName];
  if (!Array.isArray(messages)) return undefined;
  const msg = messages[0];
  return typeof msg === "string" ? msg : undefined;
};

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

function isEmptyArr(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

type WarnFieldKind = "string" | "array";

type WarnRule = {
  when: HousingApplicationField;
  fields: { key: HousingApplicationField; kind: WarnFieldKind }[];
};

type WarnRuleAny = {
  whenAny: HousingApplicationField[];
  fields: { key: HousingApplicationField; kind: WarnFieldKind }[];
};

const WARN_WHEN_YES: WarnRule[] = [
  { when: "militaryService", fields: [{ key: "vaEnrolled", kind: "string" }] },
  {
    when: "employmentOnRelease",
    fields: [
      { key: "employer", kind: "string" },
      { key: "employerContact", kind: "string" },
    ],
  },
  {
    when: "addictions",
    fields: [
      { key: "substances", kind: "string" },
      { key: "lastUseDate", kind: "string" },
    ],
  },
  {
    when: "previousTransitionalHome",
    fields: [
      { key: "previousHomeName", kind: "string" },
      { key: "previousHomeCity", kind: "string" },
    ],
  },
  {
    when: "childVisitationRequired",
    fields: [
      { key: "childFamilyServicesDocumentation", kind: "array" },
      { key: "parentGuardianNames", kind: "string" },
      { key: "child1Info", kind: "string" },
    ],
  },
  {
    when: "ssiSsdiSsrbMedicareMedicaid",
    fields: [{ key: "ssi90DayCarePlan", kind: "string" }],
  },
  {
    when: "faithBasedPreferred",
    fields: [{ key: "faithBasedProviderInfo", kind: "string" }],
  },
];

const WARN_WHEN_ANY_YES: WarnRuleAny[] = [
  {
    whenAny: ["priorInvoluntaryDischarge", "violenceHistoryDors"],
    fields: [{ key: "violenceDischargeDescription", kind: "string" }],
  },
];

function addConditionalWarnings(
  warnings: Set<HousingApplicationField>,
  values: HousingApplicationForm,
  fields: { key: HousingApplicationField; kind: WarnFieldKind }[],
) {
  for (const { key, kind } of fields) {
    if (kind === "array") {
      if (isEmptyArr(values[key])) warnings.add(key);
    } else if (isEmptyValue(values[key])) {
      warnings.add(key);
    }
  }
}

export function computeWarningFields(
  values: HousingApplicationForm,
): Set<HousingApplicationField> {
  const next = new Set<HousingApplicationField>();

  for (const k of WARN_IF_EMPTY_FIELDS) {
    const v = values[k];
    if (Array.isArray(v)) {
      if (v.length === 0) next.add(k);
    } else if (isEmptyValue(v)) {
      next.add(k);
    }
  }

  for (const rule of WARN_WHEN_YES) {
    const whenValue = values[rule.when];
    if (whenValue !== true) continue;
    addConditionalWarnings(next, values, rule.fields);
  }

  for (const rule of WARN_WHEN_ANY_YES) {
    if (!rule.whenAny.some((k) => values[k] === true)) continue;
    addConditionalWarnings(next, values, rule.fields);
  }

  if (values[FIELD_KEYS.employmentOnRelease] !== true) {
    next.delete(FIELD_KEYS.employer);
    next.delete(FIELD_KEYS.employerContact);
  }

  next.delete(FIELD_KEYS.benefitsDuration);

  for (const k of BLOCKING_FIELDS) next.delete(k);

  const dobMs = formDateToDayMs(values.dob);
  if (dobMs !== null && dobMs < MIN_HISTORICAL_DATE_MS) {
    next.add(FIELD_KEYS.dob);
  }

  if (values.age !== null && values.age > 100) next.add(FIELD_KEYS.age);

  const tpdDay = formDateToCalendarDay(values.tpdHousingNeededDate);
  if (tpdDay !== null && isPastBusinessDay(tpdDay)) {
    next.add(FIELD_KEYS.tpdHousingNeededDate);
  }

  const signatureMs = formDateToDayMs(values.signatureDate);
  if (signatureMs !== null && signatureMs < MIN_SIGNATURE_DATE_MS) {
    next.add(FIELD_KEYS.signatureDate);
  }

  return next;
}

type InputField = Field<string> | Field<string | null> | Field<number | null>;

export const handleInputChange =
  (field: InputField, options: InputChangeOptions = { type: "text" }) =>
  (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const value = e.target.value;

    switch (options.type) {
      case "phone":
        (field as Field<string>).handleChange(formatPhone(value));
        break;
      case "digits":
        {
          const next = digitsOnly(value).slice(0, options.maxLen);
          (field as Field<number | null>).handleChange(
            next.length === 0 ? null : Number(next),
          );
        }
        break;
      case "text": {
        const maxLen = options.maxLen;
        if (maxLen !== undefined) {
          const next = digitsOnly(value).slice(0, maxLen);
          (field as Field<string | null>).handleChange(
            next.length === 0 ? null : next,
          );
        } else {
          (field as Field<string>).handleChange(value);
        }
        break;
      }
      case "select":
      default:
        (field as Field<string>).handleChange(value);
    }
  };
