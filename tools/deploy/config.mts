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

import type { DeployEnv } from "./types.mts";

export const owner = "Recidiviz";
export const repo = "pulse-dashboards";

/** Glob passed to `git tag`/`git describe` to match production release tags (`vX.Y.Z`). */
export const releaseTagPattern = "v[0-9]*.[0-9]*.[0-9]*";

// Slack channels the deploy notification is posted to.
export const polarisChannelId = "C026UPMAX4G";
export const polarisEngChannelId = "C04LC0VH78B";

/**
 * The atmos stack name for a dashboard service. For staging/production the stack is
 * `recidiviz-dashboard-<env>--<name>`; demo runs against staging infra with a `-demo`
 * suffix. Valid for the services whose staging/production stacks are identical
 * (sentencing, jii-texting, case-notes). The Opportunities backend uses a different
 * prefix (`recidiviz-jii-<env>--jii`) and is left bespoke.
 */
export function dashboardStack(env: DeployEnv, name: string): string {
  return env === "demo"
    ? `recidiviz-dashboard-staging--${name}-demo`
    : `recidiviz-dashboard-${env}--${name}`;
}

// Labels (by ID, like the Slack channel IDs above) used to record where a ticket's
// change has been deployed. Live under the "Deploy Status" label group in Linear.
// "Staging"/"Production" were already taken by the pre-existing "Environment" group
// (a different semantic: "this issue affects that environment"), so these use
// distinct names ("Staging Deploy" / "Production Deploy").
export const linearStagingDeployLabelId =
  "4f687678-d2b6-435b-b721-1d94f74814a9";
export const linearProductionDeployLabelId =
  "abe39797-5bf9-475f-be73-0b5322566c4b";

// Standalone label ("Requires Manual Testing on Production") a ticket is given
// manually, ahead of time, to request an @-mention comment on its assignee once
// the change reaches production.
export const linearRequiresManualProductionTestingLabelId =
  "21dbe2c2-32da-4fc0-9340-5d84e0c27b0c";

// Matches the `Closes`/`Fixes`/`Resolves` + Linear-identifier convention baked into the
// PR template (e.g. "Closes OBT-12345"). Deliberately does NOT match the unfilled
// `Closes #XXXX` placeholder, since `XXXX` isn't a real ticket number.
export const linearTicketReferencePattern =
  /\b(?:closes|fixes|resolves)\s*:?\s*#?\s*([a-z]{2,5}-\d+)\b/gi;
