// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { flowResult } from "mobx";

import { outputFixture, usMeResidents, usMeSccpFixtures } from "~datatypes";
import { FilterParams } from "~firestore-api";

import { OfflineAPIClient } from "../apis/data/OfflineAPIClient";
import { residentsConfigByState } from "../configs/residentsConfig";
import { UsMeSCCPEligibilityReport } from "../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

let store: ResidentsStore;

beforeEach(() => {
  vi.restoreAllMocks();
  store = new ResidentsStore(new RootStore(), residentsConfigByState.US_ME);
});

describe("populate residents", () => {
  test("succeeds", async () => {
    expect(store.residentsByExternalId.size).toBe(0);

    await flowResult(store.populateResidents());

    usMeResidents.forEach((r) => {
      expect(store.residentsByExternalId.get(r.personExternalId)).toEqual(r);
    });
  });

  test("fails", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents").mockRejectedValue(
      new Error("api request failed"),
    );

    await expect(async () =>
      flowResult(store.populateResidents()),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: api request failed]`);
  });

  test("does not refetch if already populated", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    await flowResult(store.populateResidents());

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidents());
    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);
  });

  test("with filters", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    const filter: FilterParams = ["foo", "==", "bar"];
    await flowResult(store.populateResidents([filter]));

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledWith([filter]);
  });

  test("refetches with force refresh", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    await flowResult(store.populateResidents());

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidents(undefined, true));
    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(2);
  });
});

describe("populate single resident", () => {
  test("succeeds", async () => {
    const expectedRes = usMeResidents[1];

    expect(
      store.residentsByExternalId.get(expectedRes.personExternalId),
    ).toBeUndefined();

    await flowResult(store.populateResidentById(expectedRes.personExternalId));

    expect(
      store.residentsByExternalId.get(expectedRes.personExternalId),
    ).toEqual(expectedRes);
  });

  test("fails", async () => {
    await expect(
      flowResult(store.populateResidentById("does-not-exist")),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing data for resident does-not-exist in US_ME]`,
    );
  });

  test("does not refetch if already populated", async () => {
    const expectedRes = usMeResidents[1];

    vi.spyOn(OfflineAPIClient.prototype, "residentById");

    await flowResult(store.populateResidentById(expectedRes.personExternalId));

    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidentById(expectedRes.personExternalId));
    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);
  });
});

describe("populate resident eligibility", () => {
  test("succeeds", async () => {
    const expectedRes = usMeResidents[1];
    const expectedEligibility = outputFixture(
      usMeSccpFixtures.eligibleToApplyBeforeXPortionServed,
    );

    expect(
      store.residentOpportunityRecordsByExternalId.get(
        expectedRes.personExternalId,
      ),
    ).toBeUndefined();

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );

    expect(
      store.residentOpportunityRecordsByExternalId.get(
        expectedRes.personExternalId,
      ),
    ).toEqual({ usMeSCCP: expectedEligibility });
  });

  test("succeeds for ineligible resident", async () => {
    expect(
      store.residentOpportunityRecordsByExternalId.get("RES999"),
    ).toBeUndefined();

    await flowResult(
      store.populateOpportunityRecordByResidentId("RES999", "usMeSCCP"),
    );

    expect(store.residentOpportunityRecordsByExternalId.get("RES999")).toEqual(
      expect.objectContaining({
        usMeSCCP: outputFixture(usMeSccpFixtures.ineligible),
      }),
    );
  });

  test("fails", async () => {
    await expect(async () =>
      flowResult(
        store.populateOpportunityRecordByResidentId(
          "does-not-exist",
          "usMeSCCP",
        ),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Unable to find usMeSCCP record for does-not-exist]`,
    );
  });

  test("does not refetch if already populated", async () => {
    const expectedRes = usMeResidents[1];

    vi.spyOn(OfflineAPIClient.prototype, "residentEligibility");

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );

    expect(
      OfflineAPIClient.prototype.residentEligibility,
    ).toHaveBeenCalledTimes(1);

    await flowResult(
      store.populateOpportunityRecordByResidentId(
        expectedRes.personExternalId,
        "usMeSCCP",
      ),
    );
    expect(
      OfflineAPIClient.prototype.residentEligibility,
    ).toHaveBeenCalledTimes(1);
  });
});

describe("populate resident eligibility report", () => {
  const res = usMeResidents[1];
  const oppId = "usMeSCCP";
  const opp = outputFixture(usMeSccpFixtures.fullyEligibleHalfPortion);

  test("succeeds", () => {
    store.populateEligibilityReportFromData(oppId, res, opp);
    expect(
      store.residentEligibilityReportsByExternalId
        .get(res.personExternalId)
        ?.get(oppId),
    ).toBeInstanceOf(UsMeSCCPEligibilityReport);
  });

  test("fails if config is missing", () => {
    store.config.incarcerationOpportunities = {};

    expect(() =>
      store.populateEligibilityReportFromData(oppId, res, opp),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Opportunity usMeSCCP is not configured]`,
    );
  });

  test("does not recreate if already populated", () => {
    store.populateEligibilityReportFromData(oppId, res, opp);

    const firstReport = store.residentEligibilityReportsByExternalId
      .get(res.personExternalId)
      ?.get(oppId);
    // sanity check
    expect(firstReport).toBeDefined();

    // populate again
    store.populateEligibilityReportFromData(oppId, res, opp);

    // report has not changed
    const currentReport = store.residentEligibilityReportsByExternalId
      .get(res.personExternalId)
      ?.get(oppId);
    expect(currentReport).toBe(firstReport);
  });
});
