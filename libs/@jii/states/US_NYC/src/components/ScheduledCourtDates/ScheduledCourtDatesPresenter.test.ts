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

import { parseISO } from "date-fns";

import type { UsNycResidentJiiData } from "~@jii/schemas";
import { createI18nInstance, type UsNycTFunction } from "~@jii/translation";

import { ScheduledCourtDatesPresenter } from "./ScheduledCourtDatesPresenter";

type Docket = UsNycResidentJiiData["preSentenceDockets"][number];

function makeData(dockets: Array<Docket>): UsNycResidentJiiData {
  return {
    stateCode: "US_NYC",
    lastUpdatedDate: undefined,
    housingFacility: null,
    commissaryBalance: null,
    emergencyContactFullName: null,
    emergencyContactAddress: null,
    legalStatus: "Pre-sentence",
    preSentenceDockets: dockets,
    sentencedDate: null,
    projectedDischargeDate: null,
  };
}

describe("ScheduledCourtDatesPresenter", () => {
  let t: UsNycTFunction;

  beforeEach(async () => {
    const i18n = createI18nInstance([]);
    await i18n.reloadResources(["en"], ["US_NYC", "common"]);
    t = i18n.getFixedT("en", "US_NYC") as unknown as UsNycTFunction;
  });

  describe("dockets without a docket number", () => {
    let presenter: ScheduledCourtDatesPresenter;

    beforeEach(() => {
      presenter = new ScheduledCourtDatesPresenter(
        makeData([
          {
            docketNumber: null,
            nextCourtDate: new Date(2026, 11, 1),
            nextCourtTime: "9:00 AM",
            nextCourtLocation: "SNC2",
            nextCourtBorough: null,
          },
          {
            docketNumber: "CR-000102-26NY",
            nextCourtDate: new Date(2026, 11, 8),
            nextCourtTime: "3:00 PM",
            nextCourtLocation: null,
            nextCourtBorough: null,
          },
          {
            docketNumber: null,
            nextCourtDate: new Date(2026, 11, 15),
            nextCourtTime: null,
            nextCourtLocation: null,
            nextCourtBorough: "K",
          },
        ]),
        t,
      );
    });

    it("gets a distinct id for each docket", () => {
      const dataIds = presenter.scheduledCourtDatesData.dates.map((d) => d.id);
      const labelIds = presenter.dateIdOverride.map((l) => l.id);

      expect(dataIds).toEqual([
        "unknown-docket-0",
        "CR-000102-26NY",
        "unknown-docket-2",
      ]);
      expect(labelIds).toEqual(dataIds);
    });

    it("labels each docket with its own number or the unknown copy", () => {
      expect(presenter.dateIdOverride).toEqual([
        {
          id: "unknown-docket-0",
          label: "Scheduled court date for docket: Unknown Docket Number",
          description: "9:00 AM at Manhattan Supreme Court - Female Area.",
        },
        {
          id: "CR-000102-26NY",
          label: "Scheduled court date for docket: CR-000102-26NY",
          description: undefined,
        },
        {
          id: "unknown-docket-2",
          label: "Scheduled court date for docket: Unknown Docket Number",
          description: "In Brooklyn.",
        },
      ]);
    });
  });

  describe("court times", () => {
    function describeDocket(
      nextCourtDate: Date,
      nextCourtTime: Docket["nextCourtTime"],
      location: Docket["nextCourtLocation"],
    ) {
      const presenter = new ScheduledCourtDatesPresenter(
        makeData([
          {
            docketNumber: "CR-000103-26NY",
            nextCourtDate,
            nextCourtTime,
            nextCourtLocation: location,
            nextCourtBorough: "K",
          },
        ]),
        t,
      );
      return presenter.dateIdOverride[0].description;
    }

    it("shows the exported time", () => {
      expect(describeDocket(parseISO("2026-12-01"), "9:00 AM", "SKA3")).toBe(
        "9:00 AM at Brooklyn Supreme Court - Adams / 3rd Floor, in Brooklyn.",
      );
    });

    it("leaves out a null time", () => {
      expect(
        describeDocket(parseISO("2026-12-01T00:00:00"), null, "SKA3"),
      ).toBe("At Brooklyn Supreme Court - Adams / 3rd Floor, in Brooklyn.");
    });

    it("shows only the borough with a time when there is no location", () => {
      expect(
        describeDocket(parseISO("2026-12-01T13:00:00"), "1:00 PM", null),
      ).toBe("1:00 PM in Brooklyn.");
    });
  });
});
