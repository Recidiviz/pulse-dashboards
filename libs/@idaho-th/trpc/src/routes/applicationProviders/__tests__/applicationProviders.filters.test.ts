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

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
} from "~@idaho-th/prisma/client";
import { HOME_PLAN_PROVIDER_FILTERS } from "~@idaho-th/shared";

import { buildProviderApplicationWhere } from "../applicationProviders.filters";

describe("buildProviderApplicationWhere", () => {
  it("returns an empty where clause when filters are omitted", () => {
    expect(buildProviderApplicationWhere()).toEqual({});
    expect(buildProviderApplicationWhere(undefined)).toEqual({});
  });

  it("builds stage, subStage, and status filters", () => {
    expect(
      buildProviderApplicationWhere({
        stage: [ApplicationStage.APPLICATION],
        subStage: [ApplicationSubStage.CONDITIONALLY_APPROVED],
        status: [ApplicationStatus.ACTION_NEEDED],
      }),
    ).toEqual({
      stage: { in: [ApplicationStage.APPLICATION] },
      subStage: { in: [ApplicationSubStage.CONDITIONALLY_APPROVED] },
      status: { in: [ApplicationStatus.ACTION_NEEDED] },
    });
  });

  it("ignores empty filter arrays", () => {
    expect(
      buildProviderApplicationWhere({
        stage: [],
        subStage: [ApplicationSubStage.INFO_NEEDED],
        status: [],
      }),
    ).toEqual({
      subStage: { in: [ApplicationSubStage.INFO_NEEDED] },
    });
  });

  it("supports the home plan provider preset", () => {
    expect(buildProviderApplicationWhere(HOME_PLAN_PROVIDER_FILTERS)).toEqual({
      subStage: { in: [ApplicationSubStage.CONDITIONALLY_APPROVED] },
    });
  });
});
