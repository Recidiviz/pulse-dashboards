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

import type { ProviderHousingApplication } from "~@idaho-th/client/interfaces/common";
import { APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { sortProviderApplications } from "../sortProviders";

function makeProvider(
  overrides: Partial<ProviderHousingApplication> &
    Pick<ProviderHousingApplication, "providerId" | "providerName">,
): ProviderHousingApplication {
  return {
    providerApplicationId: `${overrides.providerId}-app`,
    stage: "APPLICATION",
    subStage: APPLICATION_SUB_STAGE.PROVIDER_REVIEW,
    status: "WAITING",
    providerLocation: {} as never,
    infoRequests: [],
    labels: [],
    isPreferred: false,
    ...overrides,
  };
}

describe("sortProviderApplications", () => {
  it("orders home-plan provider first, then action-needed, preferred, then others", () => {
    const homePlan = makeProvider({
      providerId: "home",
      providerName: "Home Plan Co",
      subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
    });
    const actionNeeded = makeProvider({
      providerId: "info",
      providerName: "Info Co",
      subStage: APPLICATION_SUB_STAGE.INFO_NEEDED,
    });
    const preferred = makeProvider({
      providerId: "pref",
      providerName: "Preferred Co",
      isPreferred: true,
    });
    const other = makeProvider({
      providerId: "other",
      providerName: "Other Co",
    });

    const sorted = sortProviderApplications(
      [other, preferred, actionNeeded, homePlan],
      "home",
    );

    expect(sorted.map((p) => p.providerId)).toEqual([
      "home",
      "info",
      "pref",
      "other",
    ]);
  });

  it("ranks home-plan provider first even when also preferred or action-needed", () => {
    const homePlanPreferred = makeProvider({
      providerId: "home",
      providerName: "Home Plan Co",
      isPreferred: true,
      subStage: APPLICATION_SUB_STAGE.INFO_NEEDED,
    });
    const other = makeProvider({
      providerId: "other",
      providerName: "Other Co",
    });

    const sorted = sortProviderApplications([other, homePlanPreferred], "home");

    expect(sorted.map((p) => p.providerId)).toEqual(["home", "other"]);
  });

  it("skips home-plan tier when homePlanProviderId is null or undefined", () => {
    const homePlan = makeProvider({
      providerId: "home",
      providerName: "Home Plan Co",
      subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
    });
    const other = makeProvider({
      providerId: "other",
      providerName: "Other Co",
    });

    const sortedNull = sortProviderApplications([other, homePlan], null);
    const sortedUndefined = sortProviderApplications(
      [other, homePlan],
      undefined,
    );

    expect(sortedNull.map((p) => p.providerId)).toEqual(["home", "other"]);
    expect(sortedUndefined.map((p) => p.providerId)).toEqual(["home", "other"]);
  });

  it("treats conditionally approved and info needed as the same action-needed tier", () => {
    const approved = makeProvider({
      providerId: "a",
      providerName: "A",
      subStage: APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
    });
    const infoNeeded = makeProvider({
      providerId: "b",
      providerName: "B",
      subStage: APPLICATION_SUB_STAGE.INFO_NEEDED,
    });

    const sorted = sortProviderApplications([infoNeeded, approved], null);

    expect(sorted.map((p) => p.providerId)).toEqual(["b", "a"]);
  });
});
