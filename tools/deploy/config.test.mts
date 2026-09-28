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

import { dashboardStack, dataPlatformProject } from "./config.mts";
import { jiiTexting } from "./services/jii-texting.mts";
import { meetingsBackend } from "./services/meetings.mts";

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

describe("dataPlatformProject", () => {
  it("is recidiviz-123 in production", () => {
    expect(dataPlatformProject("production")).toBe("recidiviz-123");
  });

  it("is recidiviz-staging for staging and demo", () => {
    expect(dataPlatformProject("staging")).toBe("recidiviz-staging");
    expect(dataPlatformProject("demo")).toBe("recidiviz-staging");
  });
});

// The services whose `postgres-bq-data-transfer` stack sets a `destination_project_id`
// write a DTS config into the data-platform project, so they must request a PAM grant
// there too. These pin that declaration so it cannot silently regress to the dashboard
// project alone.
describe("cross-project pamProjects", () => {
  it.each([
    ["meetingsBackend", meetingsBackend],
    ["jiiTexting", jiiTexting],
  ] as const)(
    "%s requests both projects in staging and production",
    (_, svc) => {
      expect(svc.pamProjects?.("staging")).toEqual([
        "recidiviz-dashboard-staging",
        "recidiviz-staging",
      ]);
      expect(svc.pamProjects?.("production")).toEqual([
        "recidiviz-dashboard-production",
        "recidiviz-123",
      ]);
    },
  );

  it("jiiTexting requests only the dashboard project for demo (no cross-project transfer)", () => {
    expect(jiiTexting.pamProjects?.("demo")).toEqual([
      "recidiviz-dashboard-staging",
    ]);
  });
});
