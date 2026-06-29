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
