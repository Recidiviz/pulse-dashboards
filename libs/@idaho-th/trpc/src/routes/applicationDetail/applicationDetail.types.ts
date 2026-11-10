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

import type {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HomePlanType,
  ParoleCommissionDecision,
  Prisma,
  PrismaClient,
  ReleaseDecision,
} from "~@idaho-th/prisma/client";
import type {
  ProviderLocationCore,
  ReleaseTaskProgress,
  VisibleAlert,
} from "~@idaho-th/shared";
import type { EligibleProviderWithContactView } from "~@idaho-th/trpc/routes/housing-common/eligibleProvider.selects";

import type { PRIVATE_CLOSED_OUTCOMES } from "./applicationDetail.mapper";
import {
  providerApplicationDetailSelect,
  staffApplicationDetailInclude,
} from "./applicationDetail.selects";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type EligibleProviderDetailRow = EligibleProviderWithContactView;

export type StaffApplicationDetailRow = Prisma.HousingApplicationGetPayload<{
  include: ReturnType<typeof staffApplicationDetailInclude>;
}>;

export type ProviderApplicationDetailRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<typeof providerApplicationDetailSelect>;
}>;

export type ApplicationDetailCore = {
  id: string;
  clientName: string;
  expectedReleaseDate: Date | null;
  idocNumber: string | null;
  formData: Prisma.JsonValue;
  sentToProvidersAt: Date | null;
  createdAt: Date;
  stage: ApplicationStage;
  /** Null on staff drafts; always set for provider application detail. */
  subStage: ApplicationSubStage | null;
  status: ApplicationStatus;
  releaseTaskProgress: ReleaseTaskProgress | null;
  /**
   * Read-only, loaded from the PreferredHousingProvider rows in rank order.
   * formData.preferredProviders carries the same ids for the form to edit;
   * consumers render names from here, never from formData.
   */
  preferredProviders: { id: string; name: string }[];
};

export type StaffApplicationDetail = ApplicationDetailCore & {
  eligibleProviders: EligibleProviderDetailRow[];
  homePlan: {
    type: HomePlanType;
    selectedProviderId: string | null;
    releaseDecision: ReleaseDecision | null;
  } | null;
  providerApplications: { providerId: string }[];
  hasDuplicate: boolean;
  closedOutcome: ClosedOutcome | null;
  closedOutcomeNote: string | null;
  paroleCommissionDecision: ParoleCommissionDecision | null;
  alerts: VisibleAlert[];
};

// Closed outcomes that would reveal privacy-sensitive information (e.g. a
// denial or rejection) are collapsed into the generic "CLOSED" outcome
// before reaching providers; see mapClosedOutcomeForProvider.
export type PrivateClosedOutcome = (typeof PRIVATE_CLOSED_OUTCOMES)[number];

export type ProviderVisibleClosedOutcome =
  | Exclude<ClosedOutcome, PrivateClosedOutcome>
  | "CLOSED";

export type ProviderApplicationDetail = ApplicationDetailCore & {
  providerApplicationId: string;
  updatedAt: Date;
  provider: {
    id: string;
    name: string;
  };
  providerLocation: ProviderLocationCore;
  closedOutcome: ProviderVisibleClosedOutcome | null;
  alerts: VisibleAlert[];
};
