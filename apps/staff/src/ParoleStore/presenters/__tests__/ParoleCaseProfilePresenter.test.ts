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

import { ParoleCase } from "~datatypes";

import { RootStore } from "../../../RootStore";
import { ParoleOfflineAPIClient } from "../../api/ParoleOfflineAPIClient";
import { ParoleStore } from "../../ParoleStore";
import { ParoleCaseProfilePresenter } from "../ParoleCaseProfilePresenter";

const TEST_CASE: ParoleCase = {
  docId: "DOC-45821",
  name: "Anderson, Michael",
  dob: "1986-07-27",
  currentFacility: "Central State Correctional Facility",
  custodyLevel: "Minimum",
  caseManagerName: "Jennifer Martinez",
  hearingDate: "2026-08-01",
  hearingTime: "9:00 AM",
  sentenceStartDate: "2022-07-27",
  paroleEligibilityDate: "2026-08-16",
  mandatoryReleaseDate: "2028-06-26",
  parolePlan: { onFile: true, lastUpdated: "2026-07-10", documents: [] },
  attachments: [],
  conductHistory: [],
  docPrograms: [],
  edovoPrograms: [],
  offenseHistory: {
    county: "Sangamon County",
    docket: "2021-CF-0489",
    conviction: "Armed Robbery",
    classFelony: "Class X Felony",
    sentence: "8 years",
    dateOfOffense: "2021-07-30",
    convictionDate: "2022-07-30",
    offenseNarrative: "Defendant entered convenience store with firearm.",
    priorConvictions: [],
    victimInvolved: false,
  },
};

describe("ParoleCaseProfilePresenter", () => {
  let paroleStore: ParoleStore;
  let presenter: ParoleCaseProfilePresenter;

  beforeEach(() => {
    paroleStore = new ParoleStore(new RootStore());
    presenter = new ParoleCaseProfilePresenter(paroleStore, "DOC-45821");
  });

  test("hydrate", async () => {
    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });

    const hydrationPromise = presenter.hydrate();
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    await hydrationPromise;

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  });

  test("hydration error", async () => {
    const err = new Error("fake error");
    vi.spyOn(ParoleOfflineAPIClient.prototype, "caseDetail").mockImplementation(
      () => {
        throw err;
      },
    );

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error: err });
  });

  test("caseDetail throws before hydration completes", () => {
    expect(() => presenter.caseDetail).toThrow(
      "caseDetail accessed before hydration completed successfully",
    );
  });

  test("exposes the hydrated case detail", async () => {
    vi.spyOn(ParoleOfflineAPIClient.prototype, "caseDetail").mockResolvedValue(
      TEST_CASE,
    );

    await presenter.hydrate();

    expect(presenter.caseDetail).toEqual(TEST_CASE);
  });
});
