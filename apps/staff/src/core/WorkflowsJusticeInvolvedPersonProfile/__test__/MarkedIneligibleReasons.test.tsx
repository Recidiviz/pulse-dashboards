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

import { render, screen } from "@testing-library/react";
import { Timestamp } from "firebase/firestore";
import { BrowserRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { RootStore } from "../../../RootStore";
import { OTHER_KEY } from "../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../__tests__/testUtils";
import MarkedIneligibleReasons, {
  buildActedOnText,
  buildActedOnTextAndResurfaceText,
  buildDenialReasonsListText,
  buildResurfaceText,
} from "../MarkedIneligibleReasons";

vi.mock("../../../components/StoreProvider");

const mockTenantStore = {
  labels: { releaseDateCopy: "Release", supervisionEndDateCopy: "End" },
};

const useRootStoreMock = vi.mocked(useRootStore);
useRootStoreMock.mockReturnValue({
  tenantStore: mockTenantStore,
} as unknown as RootStore);

describe("buildDenialReasonsListText", () => {
  test("override opportunities", () => {
    const testOpp = {
      ...mockOpportunity,
      config: { ...mockOpportunity.config, isAlert: true },
    };
    expect(buildDenialReasonsListText(testOpp, ["REASON"])).toEqual(
      "Override reasons: REASON",
    );
  });
  test("marked ineligible opportunities", () => {
    expect(buildDenialReasonsListText(mockOpportunity, ["REASON"])).toEqual(
      "Not eligible reasons: REASON",
    );
  });
});

describe("actedOnText", () => {
  test("marked submitted", () => {
    const testOpp = {
      ...mockOpportunity,
      isSubmitted: true,
      submittedTabTitle: "Submitted",
      submittedUpdate: {
        date: Timestamp.fromDate(new Date(2023, 9, 15)),
        by: "test-email",
      },
    };
    expect(buildActedOnText(testOpp)).toEqual(
      "Submitted by test-email on October 15, 2023.",
    );
  });

  test("marked ineligible", () => {
    const testOpp = {
      ...mockOpportunity,
      denial: { reasons: [] },
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 15),
      snoozedBy: "test-email",
    };
    expect(buildActedOnText(testOpp)).toEqual(
      "Marked ineligible by test-email on October 15, 2023.",
    );
  });

  test("override opportunities", () => {
    const testOpp = {
      ...mockOpportunity,
      denial: { reasons: [] },
      deniedTabTitle: "Overridden",
      snoozedOnDate: new Date(2023, 9, 15),
      snoozedBy: "test-email",
    };
    expect(buildActedOnText(testOpp)).toEqual(
      "Overridden by test-email on October 15, 2023.",
    );
  });

  test("no snoozed on date supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      denial: { reasons: [] },
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(buildActedOnText(testOpp)).toBeUndefined();
  });

  test("no snoozed by supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      denial: { reasons: [] },
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(buildActedOnText(testOpp)).toBeUndefined();
  });
});

describe("buildResurfaceText", () => {
  test("resurface text", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(
      buildResurfaceText(
        testOpp,
        new Date(2023, 9, 15),
        mockTenantStore.labels,
      ),
    ).toEqual(
      "Client Name may be surfaced again on or after October 15, 2023.",
    );
  });

  test("no snoozeUntil supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(
      buildResurfaceText(testOpp, undefined, mockTenantStore.labels),
    ).toBeUndefined();
  });

  test("end of supervision term", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked Ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(
      buildResurfaceText(testOpp, new Date(2025, 1, 1), mockTenantStore.labels),
    ).toEqual("February 1, 2025 is Client Name's Supervision End Date.");
  });
});

describe("MarkedIneligibleReasons", () => {
  beforeEach(() => {
    const opp = {
      ...mockOpportunity,
      config: { ...mockOpportunity.config, isAlert: true },
      snoozedBy: "test-email",
      deniedTabTitle: "Overridden",
      snoozedOnDate: new Date(2023, 9, 10),
      autoSnooze: {
        snoozeUntil: "2023-10-15",
        snoozedBy: "",
        snoozedOn: "",
      },
      denial: {
        reasons: ["REASON"],
        otherReason: "Other Reason",
      },
    };
    const testText = buildActedOnTextAndResurfaceText(
      opp,
      new Date(2023, 9, 15),
      mockTenantStore.labels,
    );
    render(
      <BrowserRouter>
        <MarkedIneligibleReasons
          opportunity={opp}
          actedOnTextAndResurfaceTextPair={testText}
          denialReasons={["REASON", OTHER_KEY]}
        />
      </BrowserRouter>,
    );
  });

  test("displays full text", () => {
    expect(
      screen.getByText(
        "Overridden by test-email on October 10, 2023. Client Name may be surfaced again on or after October 15, 2023.",
      ),
    ).toBeInTheDocument();
  });

  test("ineligible reasons list", () => {
    expect(
      screen.getByText("Override reasons: REASON, Other"),
    ).toBeInTheDocument();
  });

  test("otherReason text", () => {
    expect(screen.getByText('"Other Reason"')).toBeInTheDocument();
  });
});
