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

/**
 * Configuration and types relating to the Reentry Checklist for Massachusetts.
 *
 * This file should only contain internal identifiers, not copy. All copy should be
 * in the @jii/translation library.
 */

import { ShowIf } from "./showIf";
import { ReentryQuestionnaireQuestionId } from "./usMaReentryQuestionnaireSpec";

export const reentryChecklistSectionIds = [
  "ANYTIME",
  "TWELVE_MONTHS",
  "SIX_MONTHS",
  "THREE_MONTHS",
  "ONE_MONTH",
] as const;
export type ReentryChecklistSectionId =
  (typeof reentryChecklistSectionIds)[number];

export const reentryChecklistDomainIds = [
  "DOCUMENTS",
  "EDUCATION_AND_PROGRAMS",
  "WORK",
  "HOUSING",
  "HEALTH",
  "TRANSPORTATION",
  "COMMUNITY",
  "MONEY",
  "VETERANS",
] as const;
export type ReentryChecklistDomainId =
  (typeof reentryChecklistDomainIds)[number];

export type ReentryChecklistItemConfig = {
  section: ReentryChecklistSectionId;
  domain: ReentryChecklistDomainId;
  showIf?: ShowIf<ReentryQuestionnaireQuestionId>;
};

export const reentryChecklistItemIds = [
  "HAS_BIRTH_CERTIFICATE",
  "KNOWS_REENTRY_SPECIALIST_TIMING",
  "ENROLLED_IN_HIGH_SCHOOL_EQUIVALENCY_PROGRAM",
  "REQUESTED_BIRTH_CERTIFICATE",
  "HAS_HIGH_SCHOOL_EQUIVALENCY",
  "REVIEWED_PROGRAM_CATALOG",
  "KNOWS_WORK_SKILLS_AND_INTERESTS",
  "HAS_JOB_TRAINING",
  "HAS_UPDATED_RESUME",
  "REQUESTED_DD214",
  "RECEIVED_DD214",
  "APPLIED_FOR_OUT_OF_STATE_BIRTH_CERTIFICATE",
  "KNOWS_REQUIRED_PROGRAMS",
  "KNOWS_PEER_SUPPORT_PROGRAMS",
  "COMPLETED_REQUIRED_PROGRAMS",
  "HAS_POSITIVE_ROLE_MODELS",
  "RESEARCHED_HOUSING_RESOURCES",
  "HAS_MEDICAL_FOLLOW_UP_PLAN",
  "CAR_READY_TO_DRIVE",
  "HAS_SUPPORT_CONTACT_LIST",
  "KNOWS_MASSHEALTH_APPLICATION_PROCESS",
  "ATTENDED_MASSHIRE_INFO_SESSION",
  "DISCUSSED_HOUSING_WITH_SPECIALIST",
  "DISCUSSED_SSI_SSDI_ELIGIBILITY_WITH_SPECIALIST",
  "REQUESTED_VETERANS_ADVOCATE",
  "HAS_FAMILY_RECONNECTION_PLAN",
  "HAS_SUPPORT_PERSON",
  "HAS_HOUSING_LOCATION_PREFERENCE",
  "APPLIED_FOR_STATE_ID",
  "DISCUSSED_CASE_MANAGEMENT_WITH_SPECIALIST",
  "ENROLLED_IN_SCHOOL_AFTER_RELEASE",
  "DISCUSSED_SSI_APPLICATION_WITH_SPECIALIST",
  "DISCUSSED_SSDI_APPLICATION_WITH_SPECIALIST",
  "HOUSING_PLAN_AGREEMENT",
  "BACKUP_HOUSING",
  "HAS_RENT_PAYMENT_PLAN",
  "HAS_HOUSING_PROGRAM_RENT_PLAN",
  "HAS_FIRST_DAY_PLAN",
  "KNOWS_MENTAL_HEALTH_SUPPORT",
  "KNOWS_SUBSTANCE_USE_TREATMENT",
  "DISCUSSED_RELEASE_DAY_TRANSPORTATION_WITH_SPECIALIST",
  "APPLIED_FOR_SOCIAL_SECURITY_CARD",
  "ASKED_ABOUT_RELEASE_DAY_RIDE",
  "KNOWS_PUBLIC_TRANSIT_ROUTES",
  "HAS_BIKE_PLAN",
  "SEARCHED_FOR_JOBS",
  "KNOWS_MAT_PROVIDER",
  "RECEIVED_STATE_ID",
  "HAS_FIRST_MONTH_BUDGET",
  "RECEIVED_SOCIAL_SECURITY_CARD",
  "MASSHEALTH_APPLICATION_FILED",
  "HAS_MASSHEALTH_COVERAGE",
  "CONFIRMED_JOB_START_DATE",
  "KNOWS_DOCTOR_OR_CLINIC",
  "KNOWS_PHARMACY",
  "KNOWS_FIRST_WORK_DAY_REQUIREMENTS",
  "FINALIZED_HOUSING",
  "CONFIRMED_RELEASE_DAY_PICKUP",
  "KNOWS_RELEASE_DAY_PUBLIC_TRANSIT",
  "HAS_RELEASE_DAY_TRANSPORTATION_PLAN",
  "CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION",
  "HAS_TRANSPORTATION_TO_WORK_AND_APPOINTMENTS",
  "HAS_JOB_APPLICATION_EMAIL",
  "HAS_PAID_HOUSING_PROGRAM_DEPOSIT",
  "ASKED_ABOUT_SOBER_HOUSE_FUNDING",
] as const;
export type ReentryChecklistItemId = (typeof reentryChecklistItemIds)[number];

export const reentryChecklistConfig: Record<
  ReentryChecklistItemId,
  ReentryChecklistItemConfig
> = {
  HAS_BIRTH_CERTIFICATE: {
    section: "ANYTIME",
    domain: "DOCUMENTS",
  },
  KNOWS_REENTRY_SPECIALIST_TIMING: {
    section: "ANYTIME",
    domain: "DOCUMENTS",
  },
  ENROLLED_IN_HIGH_SCHOOL_EQUIVALENCY_PROGRAM: {
    section: "ANYTIME",
    domain: "EDUCATION_AND_PROGRAMS",
    showIf: {
      questionId: "EDUCATION_LEVEL",
      operator: "equals",
      value: "LESS_THAN_HIGH_SCHOOL",
    },
  },
  REQUESTED_BIRTH_CERTIFICATE: {
    section: "ANYTIME",
    domain: "DOCUMENTS",
  },
  HAS_HIGH_SCHOOL_EQUIVALENCY: {
    section: "ANYTIME",
    domain: "EDUCATION_AND_PROGRAMS",
    showIf: {
      questionId: "EDUCATION_LEVEL",
      operator: "equals",
      value: "LESS_THAN_HIGH_SCHOOL",
    },
  },
  REVIEWED_PROGRAM_CATALOG: {
    section: "ANYTIME",
    domain: "EDUCATION_AND_PROGRAMS",
  },
  KNOWS_WORK_SKILLS_AND_INTERESTS: {
    section: "ANYTIME",
    domain: "WORK",
  },
  HAS_JOB_TRAINING: {
    section: "ANYTIME",
    domain: "WORK",
  },
  HAS_UPDATED_RESUME: {
    section: "ANYTIME",
    domain: "WORK",
  },
  REQUESTED_DD214: {
    section: "TWELVE_MONTHS",
    domain: "DOCUMENTS",
    showIf: {
      questionId: "MILITARY_SERVICE",
      operator: "equals",
      value: "YES_NEEDS_DD214",
    },
  },
  RECEIVED_DD214: {
    section: "TWELVE_MONTHS",
    domain: "DOCUMENTS",
    showIf: {
      any: [
        {
          questionId: "MILITARY_SERVICE",
          operator: "equals",
          value: "YES_HAS_DD214",
        },
        {
          questionId: "MILITARY_SERVICE",
          operator: "equals",
          value: "YES_NEEDS_DD214",
        },
      ],
    },
  },
  APPLIED_FOR_OUT_OF_STATE_BIRTH_CERTIFICATE: {
    section: "TWELVE_MONTHS",
    domain: "DOCUMENTS",
    showIf: {
      questionId: "BORN_IN_MASSACHUSETTS",
      operator: "equals",
      value: "NO",
    },
  },
  KNOWS_REQUIRED_PROGRAMS: {
    section: "ANYTIME",
    domain: "EDUCATION_AND_PROGRAMS",
  },
  KNOWS_PEER_SUPPORT_PROGRAMS: {
    section: "ANYTIME",
    domain: "COMMUNITY",
  },
  COMPLETED_REQUIRED_PROGRAMS: {
    section: "ANYTIME",
    domain: "EDUCATION_AND_PROGRAMS",
  },
  HAS_POSITIVE_ROLE_MODELS: {
    section: "ANYTIME",
    domain: "COMMUNITY",
  },
  RESEARCHED_HOUSING_RESOURCES: {
    section: "TWELVE_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "RESIDENTIAL_RECOVERY_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  HAS_MEDICAL_FOLLOW_UP_PLAN: {
    section: "TWELVE_MONTHS",
    domain: "HEALTH",
    showIf: {
      questionId: "HEALTHCARE_DETAILS",
      operator: "equals",
      value: "ONGOING_CONDITION",
    },
  },
  CAR_READY_TO_DRIVE: {
    section: "TWELVE_MONTHS",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "TRANSPORTATION",
      operator: "equals",
      value: "OWN_CAR",
    },
  },
  HAS_SUPPORT_CONTACT_LIST: {
    section: "TWELVE_MONTHS",
    domain: "COMMUNITY",
  },
  KNOWS_MASSHEALTH_APPLICATION_PROCESS: {
    section: "TWELVE_MONTHS",
    domain: "HEALTH",
  },
  ATTENDED_MASSHIRE_INFO_SESSION: {
    section: "SIX_MONTHS",
    domain: "WORK",
  },
  DISCUSSED_HOUSING_WITH_SPECIALIST: {
    section: "TWELVE_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "RESIDENTIAL_RECOVERY_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  DISCUSSED_SSI_SSDI_ELIGIBILITY_WITH_SPECIALIST: {
    section: "TWELVE_MONTHS",
    domain: "MONEY",
    showIf: {
      any: [
        {
          questionId: "WORK_PLANS",
          operator: "equals",
          value: "DISABLED",
        },
        {
          questionId: "SSI_SSDI_ELIGIBILITY",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  REQUESTED_VETERANS_ADVOCATE: {
    section: "TWELVE_MONTHS",
    domain: "VETERANS",
    showIf: {
      any: [
        {
          questionId: "MILITARY_SERVICE",
          operator: "equals",
          value: "YES_HAS_DD214",
        },
        {
          questionId: "MILITARY_SERVICE",
          operator: "equals",
          value: "YES_NEEDS_DD214",
        },
      ],
    },
  },
  HAS_FAMILY_RECONNECTION_PLAN: {
    section: "TWELVE_MONTHS",
    domain: "COMMUNITY",
  },
  HAS_SUPPORT_PERSON: {
    section: "TWELVE_MONTHS",
    domain: "COMMUNITY",
  },
  HAS_HOUSING_LOCATION_PREFERENCE: {
    section: "TWELVE_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "RESIDENTIAL_RECOVERY_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "OWN_PLACE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "UNSURE",
        },
      ],
    },
  },
  APPLIED_FOR_STATE_ID: {
    section: "SIX_MONTHS",
    domain: "DOCUMENTS",
  },
  DISCUSSED_CASE_MANAGEMENT_WITH_SPECIALIST: {
    section: "SIX_MONTHS",
    domain: "COMMUNITY",
  },
  ENROLLED_IN_SCHOOL_AFTER_RELEASE: {
    section: "SIX_MONTHS",
    domain: "EDUCATION_AND_PROGRAMS",
    showIf: {
      questionId: "WORK_PLANS",
      operator: "equals",
      value: "ATTENDING_SCHOOL",
    },
  },
  DISCUSSED_SSI_APPLICATION_WITH_SPECIALIST: {
    section: "SIX_MONTHS",
    domain: "MONEY",
    showIf: {
      questionId: "SSI_SSDI_DETAILS",
      operator: "equals",
      value: "SSI",
    },
  },
  DISCUSSED_SSDI_APPLICATION_WITH_SPECIALIST: {
    section: "SIX_MONTHS",
    domain: "MONEY",
    showIf: {
      questionId: "SSI_SSDI_DETAILS",
      operator: "equals",
      value: "SSDI",
    },
  },
  HOUSING_PLAN_AGREEMENT: {
    section: "SIX_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FAMILY",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FRIEND",
        },
      ],
    },
  },
  BACKUP_HOUSING: {
    section: "SIX_MONTHS",
    domain: "HOUSING",
  },
  HAS_RENT_PAYMENT_PLAN: {
    section: "SIX_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FAMILY",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "FRIEND",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "ROOMING_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "OWN_PLACE",
        },
      ],
    },
  },
  HAS_HOUSING_PROGRAM_RENT_PLAN: {
    section: "SIX_MONTHS",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "RESIDENTIAL_RECOVERY_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_HOUSE",
        },
      ],
    },
  },
  HAS_FIRST_DAY_PLAN: {
    section: "THREE_MONTHS",
    domain: "COMMUNITY",
  },
  KNOWS_MENTAL_HEALTH_SUPPORT: {
    section: "THREE_MONTHS",
    domain: "HEALTH",
    showIf: {
      questionId: "HEALTHCARE_DETAILS",
      operator: "equals",
      value: "MENTAL_HEALTH",
    },
  },
  KNOWS_SUBSTANCE_USE_TREATMENT: {
    section: "THREE_MONTHS",
    domain: "HEALTH",
    showIf: {
      questionId: "HEALTHCARE_DETAILS",
      operator: "equals",
      value: "SUBSTANCE_USE",
    },
  },
  DISCUSSED_RELEASE_DAY_TRANSPORTATION_WITH_SPECIALIST: {
    section: "THREE_MONTHS",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "RELEASE_DAY_TRANSPORTATION",
      operator: "equals",
      value: "UNSURE",
    },
  },
  APPLIED_FOR_SOCIAL_SECURITY_CARD: {
    section: "SIX_MONTHS",
    domain: "DOCUMENTS",
  },
  ASKED_ABOUT_RELEASE_DAY_RIDE: {
    section: "THREE_MONTHS",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "RELEASE_DAY_TRANSPORTATION",
      operator: "equals",
      value: "UNSURE",
    },
  },
  KNOWS_PUBLIC_TRANSIT_ROUTES: {
    section: "THREE_MONTHS",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "TRANSPORTATION",
      operator: "equals",
      value: "PUBLIC_TRANSIT",
    },
  },
  HAS_BIKE_PLAN: {
    section: "THREE_MONTHS",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "TRANSPORTATION",
      operator: "equals",
      value: "BIKE",
    },
  },
  SEARCHED_FOR_JOBS: {
    section: "THREE_MONTHS",
    domain: "WORK",
    showIf: {
      questionId: "WORK_PLANS",
      operator: "equals",
      value: "LOOKING_FOR_WORK",
    },
  },
  KNOWS_MAT_PROVIDER: {
    section: "THREE_MONTHS",
    domain: "HEALTH",
    showIf: {
      questionId: "HEALTHCARE_DETAILS",
      operator: "equals",
      value: "MEDICATION_ASSISTED_TREATMENT",
    },
  },
  RECEIVED_STATE_ID: {
    section: "ONE_MONTH",
    domain: "DOCUMENTS",
  },
  HAS_FIRST_MONTH_BUDGET: {
    section: "ONE_MONTH",
    domain: "MONEY",
  },
  RECEIVED_SOCIAL_SECURITY_CARD: {
    section: "ONE_MONTH",
    domain: "DOCUMENTS",
  },
  MASSHEALTH_APPLICATION_FILED: {
    section: "ONE_MONTH",
    domain: "HEALTH",
  },
  HAS_MASSHEALTH_COVERAGE: {
    section: "ONE_MONTH",
    domain: "HEALTH",
  },
  CONFIRMED_JOB_START_DATE: {
    section: "ONE_MONTH",
    domain: "WORK",
    showIf: {
      questionId: "WORK_PLANS",
      operator: "equals",
      value: "HAS_JOB_LINED_UP",
    },
  },
  KNOWS_DOCTOR_OR_CLINIC: {
    section: "ONE_MONTH",
    domain: "HEALTH",
    showIf: {
      any: [
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "PRESCRIPTION_MEDICINE",
        },
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "ONGOING_CONDITION",
        },
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "SUBSTANCE_USE",
        },
      ],
    },
  },
  KNOWS_PHARMACY: {
    section: "ONE_MONTH",
    domain: "HEALTH",
    showIf: {
      any: [
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "PRESCRIPTION_MEDICINE",
        },
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "ONGOING_CONDITION",
        },
        {
          questionId: "HEALTHCARE_DETAILS",
          operator: "equals",
          value: "SUBSTANCE_USE",
        },
      ],
    },
  },
  KNOWS_FIRST_WORK_DAY_REQUIREMENTS: {
    section: "ONE_MONTH",
    domain: "WORK",
    showIf: {
      questionId: "WORK_PLANS",
      operator: "equals",
      value: "HAS_JOB_LINED_UP",
    },
  },
  FINALIZED_HOUSING: {
    section: "ONE_MONTH",
    domain: "HOUSING",
  },
  CONFIRMED_RELEASE_DAY_PICKUP: {
    section: "ONE_MONTH",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "RELEASE_DAY_TRANSPORTATION",
      operator: "equals",
      value: "PICKUP",
    },
  },
  KNOWS_RELEASE_DAY_PUBLIC_TRANSIT: {
    section: "ONE_MONTH",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "RELEASE_DAY_TRANSPORTATION",
      operator: "equals",
      value: "PUBLIC_TRANSPORTATION",
    },
  },
  HAS_RELEASE_DAY_TRANSPORTATION_PLAN: {
    section: "ONE_MONTH",
    domain: "TRANSPORTATION",
  },
  CONFIRMED_FAMILY_AND_FRIENDS_TRANSPORTATION: {
    section: "ONE_MONTH",
    domain: "TRANSPORTATION",
    showIf: {
      questionId: "TRANSPORTATION",
      operator: "equals",
      value: "FAMILY_OR_FRIENDS",
    },
  },
  HAS_TRANSPORTATION_TO_WORK_AND_APPOINTMENTS: {
    section: "ONE_MONTH",
    domain: "TRANSPORTATION",
  },
  HAS_JOB_APPLICATION_EMAIL: {
    section: "ONE_MONTH",
    domain: "WORK",
  },
  HAS_PAID_HOUSING_PROGRAM_DEPOSIT: {
    section: "ONE_MONTH",
    domain: "HOUSING",
    showIf: {
      any: [
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "LONG_TERM_RESIDENTIAL_PROGRAM",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "RESIDENTIAL_RECOVERY_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "SOBER_HOUSE",
        },
        {
          questionId: "HOUSING",
          operator: "equals",
          value: "ROOMING_HOUSE",
        },
      ],
    },
  },
  ASKED_ABOUT_SOBER_HOUSE_FUNDING: {
    section: "ONE_MONTH",
    domain: "HOUSING",
    showIf: {
      questionId: "HOUSING",
      operator: "equals",
      value: "SOBER_HOUSE",
    },
  },
};
