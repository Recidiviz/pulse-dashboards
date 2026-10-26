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

import { ResidentFlags } from "~@jii/data";
import { usArResidentJiiDataFixtures } from "~@jii/fixtures";
import { UsArResidentJiiData, usArStateDataSchema } from "~@jii/schemas";
import { createI18nInstance } from "~@jii/translation";

import { UsArImportantDatesPresenter } from "./UsArImportantDatesPresenter";

// The contents of the copy here don't matter, only the paths, which are used
// to test which copy the presenter picks.
const overlayFixture = (name: string) => ({
  heading: `${name} heading`,
  body: `${name} body`,
});

const usArResourceFixture = {
  importantDates: {
    eligibilityDate: {
      labels: {
        "Release Eligibility Date": "RE label",
        "Transfer Eligibility Date": "TE label",
      },
      description: {
        "Release Eligibility Date": "old RE description",
        "Transfer Eligibility Date": "old TE description",
      },
      card: {
        "Release Eligibility Date": {
          description: "new RE description",
          programUnitsRequired_one: "{{count}} unit",
          programUnitsRequired_other: "{{count}} units",
          goodTimeOverlay: overlayFixture("RE good time"),
          programmingOverlay: overlayFixture("RE programming"),
        },
        "Transfer Eligibility Date": {
          description: "new TE description",
          goodTimeOverlay: overlayFixture("TE good time"),
          programmingOverlay: overlayFixture("TE programming"),
        },
      },
    },
    maximumReleaseDate: {
      label: "MRD label",
      description: "MRD description",
    },
  },
};

const i18n = createI18nInstance([]);
i18n.addResourceBundle("en", "US_AR", usArResourceFixture);
const t = i18n.getFixedT("en", "US_AR");

const releaseEligibilityResident = usArStateDataSchema.parse({
  ...usArResidentJiiDataFixtures[0],
  eligibilityDateName: "Release Eligibility Date",
});
const transferEligibilityResident = usArStateDataSchema.parse({
  ...usArResidentJiiDataFixtures[0],
  eligibilityDateName: "Transfer Eligibility Date",
});

function createPresenter(
  metadata: UsArResidentJiiData,
  usArEdovoCredits: boolean,
) {
  return new UsArImportantDatesPresenter(
    metadata,
    { usArEdovoCredits } as ResidentFlags,
    t,
  );
}

describe("dateEntries", () => {
  it("shows the old description and no overlays when the flag is off", () => {
    const [eligibilityEntry] = createPresenter(
      releaseEligibilityResident,
      false,
    ).dateEntries;

    expect(eligibilityEntry.description).toBe("old RE description");
    expect(eligibilityEntry.overlays).toBeUndefined();
  });

  it("adds the program units to the description for RE when the flag is on", () => {
    const [eligibilityEntry] = createPresenter(
      releaseEligibilityResident,
      true,
    ).dateEntries;

    expect(eligibilityEntry.description).toBe("new RE description 14 units");
  });

  it("adds the program units to the RE programming overlay", () => {
    const [eligibilityEntry] = createPresenter(
      releaseEligibilityResident,
      true,
    ).dateEntries;

    expect(eligibilityEntry.overlays?.[1].body).toBe(
      "14 units\n\nRE programming body",
    );
  });

  it("leaves out the program units for TE", () => {
    const [eligibilityEntry] = createPresenter(
      transferEligibilityResident,
      true,
    ).dateEntries;

    expect(eligibilityEntry.description).toBe("new TE description");
    expect(eligibilityEntry.overlays?.[1].body).toBe("TE programming body");
  });

  it("links each overlay to its section of the dates page", () => {
    const [eligibilityEntry] = createPresenter(
      releaseEligibilityResident,
      true,
    ).dateEntries;

    expect(eligibilityEntry.overlays?.map((overlay) => overlay.id)).toEqual([
      "goodTime",
      "programming",
    ]);
    expect(eligibilityEntry.overlays?.[0].overlayLinkUrl).toMatch(/#goodTime$/);
    expect(eligibilityEntry.overlays?.[1].overlayLinkUrl).toMatch(
      /#programming$/,
    );
  });
});
