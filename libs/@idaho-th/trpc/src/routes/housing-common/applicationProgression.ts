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

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
} from "~@idaho-th/prisma/client";
import {
  PROVIDER_RESPONSE_ERROR_MESSAGE,
  PROVIDER_RESPONSE_TYPE,
  type ProviderResponseType,
} from "~@idaho-th/shared";

const STAFF_SUB_STAGE_RULES = [
  {
    providerSubStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
    staffSubStage: ApplicationSubStage.OFFERS_RECEIVED,
  },
  {
    providerSubStage: ApplicationSubStage.INFO_NEEDED,
    staffSubStage: ApplicationSubStage.INFO_NEEDED,
  },
  {
    providerSubStage: ApplicationSubStage.PROVIDER_REVIEW,
    staffSubStage: ApplicationSubStage.PROVIDER_REVIEW,
  },
] as const;

const ALL_DECLINED_STAFF_SUB_STAGE = ApplicationSubStage.DECLINED;

const PROVIDER_APPLICATION_SUB_STAGE_RANK = new Map<
  ApplicationSubStage,
  number
>([
  ...STAFF_SUB_STAGE_RULES.map(
    (rule, index) => [rule.providerSubStage, index] as const,
  ),
  [ApplicationSubStage.DECLINED, STAFF_SUB_STAGE_RULES.length],
  [
    ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
    STAFF_SUB_STAGE_RULES.length,
  ],
]);

const UNKNOWN_PROVIDER_SUB_STAGE_RANK = STAFF_SUB_STAGE_RULES.length + 1;

export function compareProviderApplicationSubStages(
  a: ApplicationSubStage,
  b: ApplicationSubStage,
): number {
  const rank = (subStage: ApplicationSubStage) =>
    PROVIDER_APPLICATION_SUB_STAGE_RANK.get(subStage) ??
    UNKNOWN_PROVIDER_SUB_STAGE_RANK;

  return rank(a) - rank(b);
}

const CONDITIONALLY_APPROVE_ALLOWED_FROM_SUB_STAGES =
  new Set<ApplicationSubStage>([
    ApplicationSubStage.PROVIDER_REVIEW,
    ApplicationSubStage.INFO_NEEDED,
    ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
  ]);

const DECLINE_ALLOWED_FROM_SUB_STAGES = new Set<ApplicationSubStage>([
  ApplicationSubStage.PROVIDER_REVIEW,
  ApplicationSubStage.INFO_NEEDED,
  ApplicationSubStage.CONDITIONALLY_APPROVED,
  ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
]);

const INFO_NEEDED_ALLOWED_FROM_SUB_STAGES = new Set<ApplicationSubStage>([
  ApplicationSubStage.PROVIDER_REVIEW,
  ApplicationSubStage.CONDITIONALLY_APPROVED,
  ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
]);

// CONDITIONALLY_APPROVED only exists in the Application stage, and SELECTED
// only in Approvals or Release, so the stage set below cannot pair them wrongly.
const REVOKE_ALLOWED_FROM_SUB_STAGES = new Set<ApplicationSubStage>([
  ApplicationSubStage.CONDITIONALLY_APPROVED,
  ApplicationSubStage.SELECTED,
]);

const LOCKED_PROVIDER_RESPONSE_SUB_STAGES = new Set<ApplicationSubStage>([
  ApplicationSubStage.DECLINED,
  ApplicationSubStage.SELECTED,
]);

export const STAFF_INFO_REPLY_PROVIDER_UPDATE = {
  subStage: ApplicationSubStage.PROVIDER_REVIEW,
  status: ApplicationStatus.ACTION_NEEDED,
} as const;

export const STAFF_INFO_REPLY_STAFF_STATUS = ApplicationStatus.WAITING;

const APPLICATION_STAGE_ONLY = {
  allowedFromStages: new Set<ApplicationStage>([ApplicationStage.APPLICATION]),
} as const;

// Only the home plan (SELECTED) provider reaches APPROVALS, so including it
// lets the home plan revoke there and nowhere later.
const REVOKE_ALLOWED_FROM_STAGES = new Set<ApplicationStage>([
  ApplicationStage.APPLICATION,
  ApplicationStage.APPROVALS,
]);

export function computeStaffApplicationSubStage(
  providerSubStages: ApplicationSubStage[],
): ApplicationSubStage {
  const present = new Set(providerSubStages);

  const matchedRule = STAFF_SUB_STAGE_RULES.find(({ providerSubStage }) =>
    present.has(providerSubStage),
  );

  return matchedRule?.staffSubStage ?? ALL_DECLINED_STAFF_SUB_STAGE;
}

export type ProviderResponseTransition = {
  allowedFromSubStages: ReadonlySet<ApplicationSubStage>;
  allowedFromStages: ReadonlySet<ApplicationStage>;
  providerUpdate: {
    stage: ApplicationStage;
    subStage: ApplicationSubStage;
    status: ApplicationStatus;
  };
};

export const PROVIDER_RESPONSE_TRANSITIONS: Record<
  ProviderResponseType,
  ProviderResponseTransition
> = {
  [PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE]: {
    allowedFromSubStages: CONDITIONALLY_APPROVE_ALLOWED_FROM_SUB_STAGES,
    ...APPLICATION_STAGE_ONLY,
    providerUpdate: {
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
      status: ApplicationStatus.WAITING,
    },
  },
  [PROVIDER_RESPONSE_TYPE.DECLINE]: {
    allowedFromSubStages: DECLINE_ALLOWED_FROM_SUB_STAGES,
    ...APPLICATION_STAGE_ONLY,
    providerUpdate: {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.DECLINED,
      status: ApplicationStatus.DONE,
    },
  },
  [PROVIDER_RESPONSE_TYPE.INFO_NEEDED]: {
    allowedFromSubStages: INFO_NEEDED_ALLOWED_FROM_SUB_STAGES,
    ...APPLICATION_STAGE_ONLY,
    providerUpdate: {
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.INFO_NEEDED,
      status: ApplicationStatus.WAITING,
    },
  },
  // The update for a provider not yet picked as the home plan. Revoking as the
  // chosen home plan closes the case instead; see isHomePlanRevoke.
  [PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL]: {
    allowedFromSubStages: REVOKE_ALLOWED_FROM_SUB_STAGES,
    allowedFromStages: REVOKE_ALLOWED_FROM_STAGES,
    providerUpdate: {
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      status: ApplicationStatus.DONE,
    },
  },
};

/** Path 2: the home plan provider withdraws, which closes the whole case. */
export function isHomePlanRevoke(
  providerApp: { subStage: ApplicationSubStage },
  response: ProviderResponseType,
): boolean {
  return (
    response === PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL &&
    providerApp.subStage === ApplicationSubStage.SELECTED
  );
}

export type ProviderApplicationForResponse = {
  id: string;
  providerId: string;
  stage: ApplicationStage;
  subStage: ApplicationSubStage;
  providerName: string;
  application: {
    id: string;
    sentToProvidersAt: Date | null;
    staffApplication: { id: string; status: ApplicationStatus } | null;
    providerApplications: Array<{
      id: string;
      subStage: ApplicationSubStage;
    }>;
  };
};

export type ResolvedProviderApplicationForResponse =
  ProviderApplicationForResponse & {
    application: ProviderApplicationForResponse["application"] & {
      staffApplication: { id: string; status: ApplicationStatus };
    };
  };

type ValidationError = {
  code: "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR";
  message: string;
};

const BASE_PROVIDER_RESPONSE_VALIDATIONS: Array<{
  check: (providerApp: ProviderApplicationForResponse | null) => boolean;
  error: ValidationError;
}> = [
  {
    check: (providerApp) => providerApp != null,
    error: {
      code: "NOT_FOUND",
      message: PROVIDER_RESPONSE_ERROR_MESSAGE.NOT_FOUND,
    },
  },
  {
    check: (providerApp) =>
      providerApp != null && providerApp.application.sentToProvidersAt != null,
    error: {
      code: "BAD_REQUEST",
      message: PROVIDER_RESPONSE_ERROR_MESSAGE.NOT_SENT_TO_PROVIDERS,
    },
  },
  {
    check: (providerApp) =>
      providerApp != null && providerApp.application.staffApplication != null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Staff application record not found",
    },
  },
];

export function getProviderResponseValidationError(
  providerApp: ProviderApplicationForResponse | null,
  transition: ProviderResponseTransition,
): ValidationError | undefined {
  const validations = [
    ...BASE_PROVIDER_RESPONSE_VALIDATIONS,
    {
      check: (app: ProviderApplicationForResponse | null) =>
        app != null && transition.allowedFromStages.has(app.stage),
      error: {
        code: "BAD_REQUEST" as const,
        message: PROVIDER_RESPONSE_ERROR_MESSAGE.NOT_IN_APPLICATION_STAGE,
      },
    },
    {
      // A transition that names a locked sub-stage (revoke from SELECTED)
      // is the one exception to the lock.
      check: (app: ProviderApplicationForResponse | null) =>
        app != null &&
        (!LOCKED_PROVIDER_RESPONSE_SUB_STAGES.has(app.subStage) ||
          transition.allowedFromSubStages.has(app.subStage)),
      error: {
        code: "BAD_REQUEST" as const,
        message: PROVIDER_RESPONSE_ERROR_MESSAGE.RESPONSE_LOCKED,
      },
    },
    {
      check: (app: ProviderApplicationForResponse | null) =>
        app != null && transition.allowedFromSubStages.has(app.subStage),
      error: {
        code: "BAD_REQUEST" as const,
        message: PROVIDER_RESPONSE_ERROR_MESSAGE.ALREADY_RESPONDED,
      },
    },
  ];

  return validations.find(({ check }) => !check(providerApp))?.error;
}

export function resolveProviderApplicationForResponse(
  providerApp: ProviderApplicationForResponse | null,
  response: ProviderResponseType,
):
  | { providerApp: ResolvedProviderApplicationForResponse }
  | { error: ValidationError } {
  const transition = PROVIDER_RESPONSE_TRANSITIONS[response];
  const validationError = getProviderResponseValidationError(
    providerApp,
    transition,
  );

  if (validationError != null || providerApp == null) {
    return {
      error: validationError ?? {
        code: "NOT_FOUND",
        message: PROVIDER_RESPONSE_ERROR_MESSAGE.NOT_FOUND,
      },
    };
  }

  return { providerApp: providerApp as ResolvedProviderApplicationForResponse };
}

export function computeStaffSubStageAfterProviderUpdate(
  providerApplications: Array<{ id: string; subStage: ApplicationSubStage }>,
  updatedProviderApplicationId: string,
  newSubStage: ApplicationSubStage,
): ApplicationSubStage {
  return computeStaffApplicationSubStage(
    providerApplications.map((row) =>
      row.id === updatedProviderApplicationId ? newSubStage : row.subStage,
    ),
  );
}

export function computeStaffStatusAfterProviderUpdate(
  currentStaffStatus: ApplicationStatus,
  staffSubStage: ApplicationSubStage,
  response: ProviderResponseType,
): ApplicationStatus {
  // A revoke leaves the CM waiting while the rest are still reviewing. The
  // earlier approval already set ACTION_NEEDED.
  // staffSubStage = PROVIDER_REVIEW means no one has responded yet, so we set the status to WAITING.
  if (
    response === PROVIDER_RESPONSE_TYPE.REVOKE_CONDITIONAL_APPROVAL &&
    staffSubStage === ApplicationSubStage.PROVIDER_REVIEW
  ) {
    return ApplicationStatus.WAITING;
  }

  const shouldPreserveStaffStatus =
    response === PROVIDER_RESPONSE_TYPE.DECLINE &&
    staffSubStage !== ApplicationSubStage.DECLINED;

  return shouldPreserveStaffStatus
    ? currentStaffStatus
    : ApplicationStatus.ACTION_NEEDED;
}

export function computeStaffSubStageAfterStaffInfoReply(
  providerApplications: Array<{ id: string; subStage: ApplicationSubStage }>,
  repliedProviderApplicationId: string,
): ApplicationSubStage {
  return computeStaffSubStageAfterProviderUpdate(
    providerApplications,
    repliedProviderApplicationId,
    STAFF_INFO_REPLY_PROVIDER_UPDATE.subStage,
  );
}
