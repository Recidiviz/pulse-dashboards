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

import type { z } from "zod";

import type {
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  Prisma,
  TimelineViewerRole,
} from "~@idaho-th/prisma/client";
import type {
  ApplicationLastUpdatedStatus,
  ReleaseTaskProgress,
  VisibleAlert,
} from "~@idaho-th/shared";

import type { listApplicationsBaseSchema } from "./listingApplication.schema";
import type {
  buildProviderApplicationDashboardSelect,
  buildStaffApplicationDashboardSelect,
} from "./listingApplication.selects";

/**
 * Identifies the current dashboard viewer, for scoping "New Updates".
 *
 * The role is no longer a read-state column — it discriminates this union, and
 * that is the only thing it does here. Which branch a viewer is in decides
 * which read-state table and which owner scope the queries reach for, so no
 * query ever filters on the role itself.
 */
export type StaffDashboardViewer = {
  role: typeof TimelineViewerRole.CASE_MANAGER;
  pseudonymizedId: string;
};

export type ProviderDashboardViewer = {
  role: typeof TimelineViewerRole.PROVIDER;
  /** The person — used only to exclude their own actions from "New Updates". */
  pseudonymizedId: string;
  /** The verified active organization. Required: the whole queue hangs off it. */
  providerId: string;
};

export type DashboardViewer = StaffDashboardViewer | ProviderDashboardViewer;

export type ListApplicationsInput = z.infer<typeof listApplicationsBaseSchema>;

/** Fields required to render the staff/provider applications dashboard table. */
export type ApplicationDashboardListItem = {
  id: string;
  clientName: string;
  expectedReleaseDate: Date | null;
  idocNumber: string | null;
  stage: ApplicationStage;
  subStage: ApplicationSubStage | null;
  status: ApplicationStatus;
  releaseTaskProgress: ReleaseTaskProgress | null;
  lastUpdatedAt: Date;
  lastUpdatedStatus?: ApplicationLastUpdatedStatus | null;
  providerApplicationId?: string;
  /** Provider viewers only — is this provider the home plan's selected provider? */
  isSelectedProvider?: boolean;
};

// intakeStatus/closedOutcome/closedOutcomeNote (closedOutcomeNote is CM
// free-text) are staff-only and must never reach a provider. Kept on a
// dedicated type — rather than optional fields on the shared dashboard item —
// so a provider mapper can't be extended to populate them by accident.
export type StaffApplicationDashboardListItem = ApplicationDashboardListItem & {
  intakeStatus: ApplicationIntakeStatus;
  closedOutcome: ClosedOutcome | null;
  closedOutcomeNote: string | null;
};

export type ProviderApplicationDashboardListItem =
  ApplicationDashboardListItem & {
    alerts: VisibleAlert[];
  };

/** @deprecated Use ApplicationDashboardListItem — list endpoints return dashboard fields only. */
export type ApplicationListItem = ApplicationDashboardListItem;

export type StaffApplicationRecord = Prisma.StaffHousingApplicationGetPayload<{
  include: {
    application: {
      select: ReturnType<typeof buildStaffApplicationDashboardSelect>;
    };
  };
}>;

export type ProviderApplicationRecord =
  Prisma.ProviderHousingApplicationGetPayload<{
    include: {
      application: {
        select: ReturnType<typeof buildProviderApplicationDashboardSelect>;
      };
    };
  }>;

export type StaffApplicationDashboardCore =
  Prisma.HousingApplicationGetPayload<{
    select: ReturnType<typeof buildStaffApplicationDashboardSelect>;
  }>;

export type ProviderApplicationDashboardCore =
  Prisma.HousingApplicationGetPayload<{
    select: ReturnType<typeof buildProviderApplicationDashboardSelect>;
  }>;

/**
 * The two shapes differ only in which read-state relation they carry — the
 * split tables have different names, so the row the mapper is handed is a
 * union rather than one row with a role column on it.
 */
export type ApplicationDashboardCore =
  | StaffApplicationDashboardCore
  | ProviderApplicationDashboardCore;
