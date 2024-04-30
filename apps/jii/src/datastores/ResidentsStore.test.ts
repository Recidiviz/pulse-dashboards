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

import {
  outputFixture,
  outputFixtureArray,
  usMeResidents,
  usMeSccpFixtures,
} from "~datatypes";

import { OfflineAPIClient } from "../api/OfflineAPIClient";
import { residentsConfigByState } from "../configs/residentsConfig";
import { UsMeSCCPEligibilityReport } from "../models/EligibilityReport/UsMe/UsMeSCCPEligibilityReport";
import { ResidentsStore } from "./ResidentsStore";
import { RootStore } from "./RootStore";

let store: ResidentsStore;

beforeEach(() => {
  vi.restoreAllMocks();
  store = new ResidentsStore(new RootStore(), residentsConfigByState.US_ME);
});

describe("populate all residents", () => {
  test("succeeds", async () => {
    expect(store.residentsByExternalId.size).toBe(0);

    await flowResult(store.populateAllResidents());

    outputFixtureArray(usMeResidents).forEach((r) => {
      expect(store.residentsByExternalId.get(r.personExternalId)).toEqual(r);
    });
  });

  test("fails", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents").mockRejectedValue(
      new Error("api request failed"),
    );

    await expect(async () =>
      flowResult(store.populateAllResidents()),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: api request failed]`);
  });

  test("does not refetch if already populated", async () => {
    vi.spyOn(OfflineAPIClient.prototype, "residents");

    await flowResult(store.populateAllResidents());

    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);

    await flowResult(store.populateAllResidents());
    expect(OfflineAPIClient.prototype.residents).toHaveBeenCalledTimes(1);
  });
});

describe("populate single resident", () => {
  test("succeeds", async () => {
    const expectedRes = outputFixture(usMeResidents[1]);

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
    const expectedRes = outputFixture(usMeResidents[1]);

    vi.spyOn(OfflineAPIClient.prototype, "residentById");

    await flowResult(store.populateResidentById(expectedRes.personExternalId));

    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);

    await flowResult(store.populateResidentById(expectedRes.personExternalId));
    expect(OfflineAPIClient.prototype.residentById).toHaveBeenCalledTimes(1);
  });
});

describe("populate resident eligibility", () => {
  test("succeeds", async () => {
    const expectedRes = outputFixture(usMeResidents[1]);
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
      store.residentOpportunityRecordsByExternalId.get("not-eligible"),
    ).toBeUndefined();

    await flowResult(
      store.populateOpportunityRecordByResidentId("not-eligible", "usMeSCCP"),
    );

    expect(
      store.residentOpportunityRecordsByExternalId.get("not-eligible"),
    ).toEqual(expect.objectContaining({ usMeSCCP: undefined }));
  });

  test("fails", async () => {
    const expectedRes = outputFixture(usMeResidents[1]);

    vi.spyOn(
      OfflineAPIClient.prototype,
      "residentEligibility",
    ).mockRejectedValue(new Error("api request failed"));

    await expect(async () =>
      flowResult(
        store.populateOpportunityRecordByResidentId(
          expectedRes.personExternalId,
          "usMeSCCP",
        ),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: api request failed]`);
  });

  test("does not refetch if already populated", async () => {
    const expectedRes = outputFixture(usMeResidents[1]);

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
  const expectedRes = outputFixture(usMeResidents[1]);
  const oppId = "usMeSCCP";
  const config = residentsConfigByState.US_ME.incarcerationOpportunities[oppId];

  test("succeeds", async () => {
    await store.populateEligibilityReportByResidentId(
      expectedRes.personExternalId,
      oppId,
      config,
    );
    expect(
      store.residentEligibilityReportsByExternalId
        .get(expectedRes.personExternalId)
        ?.get(oppId),
    ).toBeInstanceOf(UsMeSCCPEligibilityReport);
  });

  test("fails", async () => {
    await expect(
      store.populateEligibilityReportByResidentId(
        "does-not-exist",
        oppId,
        config,
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing data for resident does-not-exist in US_ME]`,
    );
  });

  test("populates its dependencies if needed", async () => {
    vi.spyOn(store, "populateResidentById");
    vi.spyOn(store, "populateOpportunityRecordByResidentId");

    await store.populateEligibilityReportByResidentId(
      expectedRes.personExternalId,
      oppId,
      config,
    );

    expect(store.populateResidentById).toHaveBeenCalledExactlyOnceWith(
      expectedRes.personExternalId,
    );
    expect(
      store.populateOpportunityRecordByResidentId,
    ).toHaveBeenCalledExactlyOnceWith(expectedRes.personExternalId, oppId);
  });

  test("does not recreate if already populated", async () => {
    vi.spyOn(store, "populateResidentById");
    vi.spyOn(store, "populateOpportunityRecordByResidentId");

    await store.populateEligibilityReportByResidentId(
      expectedRes.personExternalId,
      oppId,
      config,
    );
    const firstReport = store.residentEligibilityReportsByExternalId
      .get(expectedRes.personExternalId)
      ?.get(oppId);
    // sanity check
    expect(firstReport).toBeDefined();

    // populate again
    await store.populateEligibilityReportByResidentId(
      expectedRes.personExternalId,
      oppId,
      config,
    );

    // report has not changed
    const currentReport = store.residentEligibilityReportsByExternalId
      .get(expectedRes.personExternalId)
      ?.get(oppId);
    expect(currentReport).toBe(firstReport);

    // dependencies were not repopulated
    expect(store.populateResidentById).toHaveBeenCalledOnce();
    expect(store.populateOpportunityRecordByResidentId).toHaveBeenCalledOnce();
  });
});
