// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { BrowserRouter } from "react-router-dom";

import { useFeatureVariants } from "../../../components/StoreProvider";
import { OTHER_KEY } from "../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../__tests__/testUtils";
import MarkedIneligibleReasons, {
  buildDenialReasonsListText,
  buildResurfaceText,
  buildSnoozedByText,
} from "../MarkedIneligibleReasons";

jest.mock("../../../components/StoreProvider");

const useFeatureVariantsMock = useFeatureVariants as jest.Mock;

describe("buildDenialReasonsListText", () => {
  test("override opportunities", () => {
    const testOpp = {
      ...mockOpportunity,
      isAlert: true,
    };
    expect(buildDenialReasonsListText(testOpp, ["REASON"])).toEqual(
      "Override reasons: REASON"
    );
  });
  test("marked ineligible opportunities", () => {
    expect(buildDenialReasonsListText(mockOpportunity, ["REASON"])).toEqual(
      "Not eligible reasons: REASON"
    );
  });
});

describe("snoozedByText", () => {
  test("marked ineligible", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked ineligible",
    };
    expect(
      buildSnoozedByText(testOpp, new Date(2023, 9, 15), "test-email")
    ).toEqual("Marked ineligible by test-email on October 15, 2023.");
  });

  test("override opportunities", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Overridden",
    };
    expect(
      buildSnoozedByText(testOpp, new Date(2023, 9, 15), "test-email")
    ).toEqual("Overridden by test-email on October 15, 2023.");
  });

  test("no snoozed on date supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(
      buildSnoozedByText(testOpp, undefined, "test-email")
    ).toBeUndefined();
  });

  test("no snoozed by supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(
      buildSnoozedByText(testOpp, testOpp.snoozedOnDate, undefined)
    ).toBeUndefined();
  });
});

describe("buildResurfaceText", () => {
  test("resurface text", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(buildResurfaceText(testOpp, new Date(2023, 9, 15))).toEqual(
      "Client Name may be surfaced again on or after October 15, 2023."
    );
  });

  test("no snoozeUntil supplied", () => {
    const testOpp = {
      ...mockOpportunity,
      deniedTabTitle: "Marked ineligible",
      snoozedOnDate: new Date(2023, 9, 10),
    };
    expect(buildResurfaceText(testOpp, undefined)).toBeUndefined();
  });
});

describe("MarkedIneligibleReasons", () => {
  beforeEach(() => {
    useFeatureVariantsMock.mockReturnValue({ enableSnooze: {} });
    render(
      <BrowserRouter>
        <MarkedIneligibleReasons
          opportunity={{
            ...mockOpportunity,
            isAlert: true,
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
          }}
          snoozeUntil={new Date(2023, 9, 15)}
          denialReasons={["REASON", OTHER_KEY]}
        />
      </BrowserRouter>
    );
  });

  test("displays full text", () => {
    expect(
      screen.getByText(
        "Overridden by test-email on October 10, 2023. Client Name may be surfaced again on or after October 15, 2023."
      )
    ).toBeInTheDocument();
  });

  test("ineligible reasons list", () => {
    expect(
      screen.getByText("Override reasons: REASON, Other")
    ).toBeInTheDocument();
  });

  test("undo link", () => {
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });
});