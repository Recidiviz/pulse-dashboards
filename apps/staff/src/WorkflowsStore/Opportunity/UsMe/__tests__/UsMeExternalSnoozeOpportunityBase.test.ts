// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { Timestamp } from "firebase/firestore";
import { configure } from "mobx";
import tk from "timekeeper";
import { z } from "zod";

import { opportunitySchemaBase, usMeDenialMetadataSchema } from "~datatypes";

import { RootStore } from "../../../../RootStore";
import { Resident } from "../../../Resident";
import { getSnoozeUntilDate } from "../../../utils";
import {
  usMeFurloughReleaseEligibleRecordFixture,
  usMePersonRecord,
} from "../__fixtures__";
import { UsMeExternalSnoozeOpportunityBase } from "../UsMeExternalSnoozeOpportunityBase/UsMeExternalSnoozeOpportunityBase";

const oppSchema = opportunitySchemaBase.extend({
  metadata: z.object({
    denial: usMeDenialMetadataSchema,
  }),
});

let opp: UsMeExternalSnoozeOpportunityBase<Resident, z.infer<typeof oppSchema>>;
let resident: Resident;
let root: RootStore;

vi.mock("../../../subscriptions");

function initOpportunity({
  withSnoozeInRecord,
}: {
  withSnoozeInRecord: boolean;
}) {
  const opportunityRecord = withSnoozeInRecord
    ? {
        ...usMeFurloughReleaseEligibleRecordFixture,
        metadata: {
          denial: {
            updatedBy: "casenote",
            startDate: "2022-12-01",
            endDate: "2022-12-25",
            reasons: ["CASENOTE"],
          },
        },
      }
    : usMeFurloughReleaseEligibleRecordFixture;

  // Even though we're directly instantiating the base class, we'll still call it
  // a usMeFurloughRelease so we don't have to worry about mocking a config
  opp = new UsMeExternalSnoozeOpportunityBase(
    resident,
    "usMeFurloughRelease",
    root,
    oppSchema.parse(opportunityRecord),
  );
}

function mockFirestoreSnooze() {
  // This is a snooze from firestore that we expect to be ignored when the FV is active
  vi.spyOn(opp, "updates", "get").mockReturnValue({
    denial: {
      reasons: ["FIRESTORE"],
      updated: {
        by: "firestore",
        date: new Timestamp(0, 0),
      },
    },
    manualSnooze: {
      snoozedBy: "firestore",
      snoozedOn: "2022-11-01",
      snoozeForDays: 999,
    },
  });
}

beforeEach(() => {
  // this lets us spy on observables, e.g. computed getters
  configure({ safeDescriptors: false });
  tk.freeze(new Date(2022, 11, 15)); // 11 is December

  root = new RootStore();
  root.workflowsRootStore.opportunityConfigurationStore.mockHydrated();
  vi.spyOn(
    root.workflowsRootStore.opportunityConfigurationStore,
    "enabledOpportunityTypes",
    "get",
  ).mockReturnValue(["usMeFurloughRelease"]);

  resident = new Resident(usMePersonRecord, root);
});

afterEach(() => {
  tk.reset();
  configure({ safeDescriptors: true });
  vi.resetAllMocks();
});

describe("FV off", () => {
  // If the feature variant is off, we want the opportunity to reflect what's in firestore
  // even if there is a snooze defined on the opportunity record

  test("reflects snooze in firestore", () => {
    initOpportunity({ withSnoozeInRecord: true });
    mockFirestoreSnooze();

    expect(opp.denial?.updated?.by).toEqual("firestore");
    expect(opp.manualSnooze?.snoozedBy).toEqual("firestore");
  });

  test("reflects lack of snooze in firestore", () => {
    initOpportunity({ withSnoozeInRecord: true });

    expect(opp.denial).toBeUndefined();
    expect(opp.manualSnooze).toBeUndefined();
  });
});

describe("FV on", () => {
  // If the feature variant is on, we want the opportunity to reflect what's in the
  // oportunity record even if there is a snooze defined in firestore

  beforeEach(() => {
    vi.spyOn(root.userStore, "activeFeatureVariants", "get").mockReturnValue({
      usMeCaseNoteSnooze: {},
    });
  });

  test("reflects snooze in the record", () => {
    initOpportunity({ withSnoozeInRecord: true });
    mockFirestoreSnooze();

    expect(opp.denial?.updated?.by).toEqual("casenote");
    expect(opp.manualSnooze?.snoozedBy).toEqual("casenote");
  });

  test("reflects lack of snooze in the record", () => {
    initOpportunity({ withSnoozeInRecord: false });
    mockFirestoreSnooze();

    expect(opp.denial).toBeUndefined();
    expect(opp.manualSnooze).toBeUndefined();
  });

  test("does date math correctly", () => {
    initOpportunity({ withSnoozeInRecord: true });

    expect(opp.manualSnooze).toEqual({
      snoozeForDays: 24,
      snoozedBy: "casenote",
      snoozedOn: "2022-12-01T00:00:00Z",
    });

    // Ensure that the date calculated back out from snoozeForDays
    // matches what was originally in the record
    const recalculatedDate = getSnoozeUntilDate(opp.manualSnooze ?? {});
    expect(recalculatedDate).toEqual(parseISO("2022-12-25"));
  });

  test("ignores expired snooze", () => {
    // set time to after our snooze's expiration
    tk.freeze(new Date(2023, 6, 1));
    initOpportunity({ withSnoozeInRecord: true });

    expect(opp.denial).toBeUndefined();
    expect(opp.manualSnooze).toBeUndefined();
  });
});
