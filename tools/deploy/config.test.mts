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

import { describe, expect, it } from "vitest";

import { dashboardStack } from "./config.mts";

describe("dashboardStack", () => {
  it("uses recidiviz-dashboard-<env>--<name> for staging", () => {
    expect(dashboardStack("staging", "sentencing")).toBe(
      "recidiviz-dashboard-staging--sentencing",
    );
  });

  it("uses recidiviz-dashboard-<env>--<name> for production", () => {
    expect(dashboardStack("production", "case-notes")).toBe(
      "recidiviz-dashboard-production--case-notes",
    );
  });

  it("routes demo to staging infra with a -demo suffix", () => {
    expect(dashboardStack("demo", "jii-texting")).toBe(
      "recidiviz-dashboard-staging--jii-texting-demo",
    );
  });
});
