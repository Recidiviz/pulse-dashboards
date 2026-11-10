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

import {
  APPLICATION_SUB_STAGE,
  PROVIDER_RESPONSE_TYPE,
} from "~@idaho-th/shared";

import {
  getSubmittedStatus,
  LOCKED_SUB_STAGES,
  RESPONSES_WITH_CHANGE_SUB_STAGES,
  SUB_STAGE_TO_RESPONSE_TYPE,
  SUBMITTED_RESPONSE_SUB_STAGES,
  SUBMITTED_STATUS,
} from "../applicationResponse.constants";

describe("provider response UI constants", () => {
  it("marks Request Info as editable after submit, but not Conditionally Approve (it gets a Revoke button instead)", () => {
    expect(
      RESPONSES_WITH_CHANGE_SUB_STAGES.has(
        APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED,
      ),
    ).toBe(false);
    expect(
      RESPONSES_WITH_CHANGE_SUB_STAGES.has(APPLICATION_SUB_STAGE.INFO_NEEDED),
    ).toBe(true);
    expect(
      RESPONSES_WITH_CHANGE_SUB_STAGES.has(APPLICATION_SUB_STAGE.DECLINED),
    ).toBe(false);
  });

  it("locks Selected, Not Selected, and Canceled so responses cannot be edited", () => {
    expect(LOCKED_SUB_STAGES.has(APPLICATION_SUB_STAGE.SELECTED)).toBe(true);
    expect(LOCKED_SUB_STAGES.has(APPLICATION_SUB_STAGE.NOT_SELECTED)).toBe(
      true,
    );
    expect(LOCKED_SUB_STAGES.has(APPLICATION_SUB_STAGE.CANCELED)).toBe(true);
  });

  it("never marks a sub-stage as both editable and locked", () => {
    for (const s of RESPONSES_WITH_CHANGE_SUB_STAGES) {
      expect(LOCKED_SUB_STAGES.has(s)).toBe(false);
    }
  });

  it("treats declined and terminal states as submitted responses", () => {
    expect(
      SUBMITTED_RESPONSE_SUB_STAGES.has(APPLICATION_SUB_STAGE.DECLINED),
    ).toBe(true);
    expect(
      SUBMITTED_RESPONSE_SUB_STAGES.has(APPLICATION_SUB_STAGE.CANCELED),
    ).toBe(true);
  });

  it("maps submitted sub-stages back to the correct radio response type", () => {
    expect(
      SUB_STAGE_TO_RESPONSE_TYPE[APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED],
    ).toBe(PROVIDER_RESPONSE_TYPE.CONDITIONALLY_APPROVE);
    expect(SUB_STAGE_TO_RESPONSE_TYPE[APPLICATION_SUB_STAGE.INFO_NEEDED]).toBe(
      PROVIDER_RESPONSE_TYPE.INFO_NEEDED,
    );
  });

  it("shows Selected badge copy when the provider is chosen as home plan", () => {
    expect(SUBMITTED_STATUS[APPLICATION_SUB_STAGE.SELECTED]).toMatchObject({
      badge: "Selected as Home Plan",
    });
  });

  it("shows badges and footnotes for locked provider outcomes", () => {
    expect(SUBMITTED_STATUS[APPLICATION_SUB_STAGE.DECLINED]).toMatchObject({
      badge: "Declined",
    });
    expect(
      SUBMITTED_STATUS[APPLICATION_SUB_STAGE.DECLINED].footnote,
    ).toBeUndefined();
    expect(SUBMITTED_STATUS[APPLICATION_SUB_STAGE.NOT_SELECTED]).toMatchObject({
      badge: "Provider Not Selected",
      footnote: "The client selected a different home plan.",
    });
    expect(SUBMITTED_STATUS[APPLICATION_SUB_STAGE.CANCELED]).toMatchObject({
      badge: "Application Canceled",
      footnote: "The client no longer needs housing and/or has other plans",
    });
    expect(SUBMITTED_STATUS[APPLICATION_SUB_STAGE.RELEASED]).toMatchObject({
      badge: "Released",
      footnote:
        "This case is now closed, and the client is being released to your care. For any follow-ups, contact the Case Manager directly.",
    });
  });

  describe("getSubmittedStatus", () => {
    const CLOSED_FOOTNOTE =
      "This case was closed for an unspecified reason. Please contact the Case Manager directly if you have questions.";

    it("shows Canceled for a canceled application with no closed outcome", () => {
      expect(
        getSubmittedStatus(APPLICATION_SUB_STAGE.CANCELED, null),
      ).toMatchObject({ badge: "Application Canceled", variant: "attention" });
    });

    it("shows Closed for a canceled application closed as OTHER", () => {
      expect(
        getSubmittedStatus(APPLICATION_SUB_STAGE.CANCELED, "OTHER"),
      ).toMatchObject({
        badge: "Closed",
        variant: "info",
        footnote: CLOSED_FOOTNOTE,
      });
    });

    it("shows Canceled for a canceled application closed with any other outcome", () => {
      expect(
        getSubmittedStatus(APPLICATION_SUB_STAGE.CANCELED, "CLIENT_RELEASED"),
      ).toMatchObject({ badge: "Application Canceled", variant: "attention" });
      expect(
        getSubmittedStatus(APPLICATION_SUB_STAGE.CANCELED, "CLOSED"),
      ).toMatchObject({ badge: "Application Canceled", variant: "attention" });
    });

    it("falls back to the static status for sub-stages without an override", () => {
      expect(
        getSubmittedStatus(APPLICATION_SUB_STAGE.DECLINED, null),
      ).toMatchObject({ badge: "Declined" });
    });

    it("shows the Closed footnote as the default status when there is no sub-stage", () => {
      expect(getSubmittedStatus(null, null)).toMatchObject({
        badge: "Closed",
        footnote: CLOSED_FOOTNOTE,
      });
    });

    it("treats an undefined sub-stage the same as null, showing the Closed default", () => {
      expect(getSubmittedStatus(undefined, null)).toMatchObject({
        badge: "Closed",
        footnote: CLOSED_FOOTNOTE,
      });
    });
  });
});
