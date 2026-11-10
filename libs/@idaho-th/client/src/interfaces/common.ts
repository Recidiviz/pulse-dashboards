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

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AlertType } from "~@idaho-th/shared";
import type { AppRouter } from "~@idaho-th/trpc-types";

import { LABEL_STATE } from "../constants/label";

type HousingApplicationOutputs =
  inferRouterOutputs<AppRouter>["housingApplication"];

type HousingApplicationInputs =
  inferRouterInputs<AppRouter>["housingApplication"];

type HousingProviderOutputs = inferRouterOutputs<AppRouter>["housingProvider"];

type ResolvedHousingProvider =
  HousingProviderOutputs["resolve"]["housingProviders"][number];

/**
 * A HousingProvider as the selection screen sees it: one of the caller's own
 * organizations. Distinct from `HousingProvider` below, which is the staff
 * matching view of the same table. The summary fields are optional because
 * only the cards show them; the store needs just the identifier.
 */
export type HousingProviderOption = Pick<
  ResolvedHousingProvider,
  "id" | "name"
> &
  Partial<Pick<ResolvedHousingProvider, "locationsCount" | "districts">>;

export type InfoRequest = NonNullable<
  HousingApplicationOutputs["getStaffInfoRequest"]["infoRequest"]
>;

export type InfoRequestStatusType = InfoRequest["status"];

type StaffHousingApplicationRow =
  HousingApplicationOutputs["getByStaff"]["items"][number];

type ProviderHousingApplicationRow =
  HousingApplicationOutputs["getProviderApplications"]["items"][number];

type HousingApplicationCommon = Pick<
  ProviderHousingApplicationRow,
  | "id"
  | "clientName"
  | "expectedReleaseDate"
  | "idocNumber"
  | "stage"
  | "subStage"
  | "status"
  | "releaseTaskProgress"
  | "lastUpdatedAt"
  | "lastUpdatedStatus"
  | "providerApplicationId"
  | "isSelectedProvider"
>;

// Dashboard list row (staff + provider tables). Providers never receive
// intakeStatus/closedOutcome/closedOutcomeNote (staff-only fields, see
// StaffApplicationDashboardListItem on the backend) — kept optional here so
// this shared row type reflects what's actually present for either viewer.
export type HousingApplication = HousingApplicationCommon & {
  alerts?: ProviderHousingApplicationRow["alerts"];
  intakeStatus?: StaffHousingApplicationRow["intakeStatus"];
  closedOutcome?: StaffHousingApplicationRow["closedOutcome"];
  closedOutcomeNote?: StaffHousingApplicationRow["closedOutcomeNote"];
};

export type ApplicationSubStage = NonNullable<HousingApplication["subStage"]>;
export type ApplicationStage = NonNullable<HousingApplication["stage"]>;
export type PreviewApplication = Pick<HousingApplication, "id" | "stage">;

export type StaffApplicationDetail =
  HousingApplicationOutputs["getStaffApplicationById"];

export type ReleaseTaskProgress = NonNullable<
  StaffApplicationDetail["releaseTaskProgress"]
>;

export type ProviderApplicationDetail =
  HousingApplicationOutputs["getProviderApplicationById"];

export type Alert =
  HousingApplicationOutputs["getProviderApplicationById"]["alerts"][number];

export type ReleaseDateChangedAlert = Extract<
  Alert,
  { type: typeof AlertType.RELEASE_DATE_CHANGED }
>;

export type EligibleHousingProviderRow = NonNullable<
  StaffApplicationDetail["eligibleProviders"]
>[number];

export type EligibleProviderSearchRow =
  HousingApplicationOutputs["getProvidersWithEligibility"]["providers"][number];

export type StaffHomePlan = HousingApplicationOutputs["getStaffHomePlan"];

export type HomePlan = NonNullable<StaffHomePlan["homePlan"]>;
export type Approvals = NonNullable<StaffHomePlan["approvals"]>;
// The merged state the release gate reasons about (any decision may be
// unrecorded). Only one release-side decision is ever set: the Parole
// Commission's for a Termer/PV, the court's for a Rider.
export type ApprovalsDecisions = Pick<
  Approvals,
  "releaseDecision" | "homePlanInvestigation"
> &
  Pick<StaffApplicationDetail, "paroleCommissionDecision">;
// What a single Save sends: one or both decisions, never an explicit null.
export type ApprovalsDecisionInput = Omit<
  HousingApplicationInputs["setHomePlanApprovals"],
  "applicationId"
>;
export type HomePlanType = NonNullable<HomePlan["type"]>;

export type ProviderHomePlan = HousingApplicationOutputs["getProviderHomePlan"];
export type ApplicationClosedOutcome =
  ProviderApplicationDetail["closedOutcome"];

type ApplicationProviderRow =
  HousingApplicationOutputs["getStaffApplicationProviders"]["providers"][number];

type ProviderLocationRow = ApplicationProviderRow["providerLocation"];

type ProviderLocationDetailRow =
  HousingApplicationOutputs["getProviderDetails"]["locations"][number];

export type HousingProviderLocation = Pick<
  ProviderLocationRow,
  | "id"
  | "district"
  | "acceptedGenders"
  | "acceptsRiders"
  | "acceptsSexOffenders"
  | "acceptsViolentCriminals"
  | "faithBased"
> &
  Partial<
    Pick<
      ProviderLocationRow,
      | "providerId"
      | "housingType"
      | "populationsServed"
      | "addressUsedForPPInvestigation"
    >
  > &
  Partial<
    Pick<ProviderLocationDetailRow, "streetAddress" | "city" | "state" | "zip">
  >;

type HousingProviderRow = EligibleHousingProviderRow["provider"];

/**
 * A HousingProvider row as staff see it while matching an application.
 * `isSelected` comes from the EligibleHousingProvider join; `labels` and
 * `isPreferred` are derived client-side from the eligibility params.
 */
/**
 * The one person staff are shown for an organization: its first assigned user.
 * A display convenience resolved server-side — an organization may have several
 * users or none, and this is never an authorization fact.
 */
export type HousingProviderContact = NonNullable<HousingProviderRow["contact"]>;

export type HousingProvider = Pick<HousingProviderRow, "id" | "name"> &
  Partial<Pick<HousingProviderRow, "contact">> & {
    providerLocation: HousingProviderLocation;
    isSelected?: boolean | null;
    isPreferred?: boolean;
    labels?: ProviderLabel[];
  };

export type ProviderHousingApplication = Pick<
  ApplicationProviderRow,
  "providerId" | "providerName"
> &
  Partial<
    Pick<
      ApplicationProviderRow,
      | "contact"
      | "providerApplicationId"
      | "stage"
      | "subStage"
      | "status"
      | "infoRequests"
      | "approvalRevoked"
      | "createdAt"
    >
  > & {
    providerLocation: HousingProviderLocation;
    labels: ProviderLabel[];
    isPreferred?: boolean;
  };

export type LabelState = (typeof LABEL_STATE)[keyof typeof LABEL_STATE];

export type ProviderLabel = {
  text: string;
  state: LabelState;
  displayOrder: number;
};
