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

import { APPLICATION_STAGE, APPLICATION_SUB_STAGE } from "~@idaho-th/shared";

import { STAGE_LABELS, SUB_STAGE_LABELS } from "../common";

describe("stage and sub-stage labels", () => {
  it("labels every client progression stage from the PRD", () => {
    expect(STAGE_LABELS).toEqual({
      [APPLICATION_STAGE.DRAFT]: "Draft",
      [APPLICATION_STAGE.APPLICATION]: "Application",
      [APPLICATION_STAGE.APPROVALS]: "Approvals",
      [APPLICATION_STAGE.RELEASE]: "Release",
      [APPLICATION_STAGE.CLOSED]: "Closed",
    });
  });

  it("labels every sub-stage", () => {
    expect(SUB_STAGE_LABELS).toEqual({
      [APPLICATION_SUB_STAGE.PROVIDER_REVIEW]: "Provider Review",
      [APPLICATION_SUB_STAGE.OFFERS_RECEIVED]: "Offers Received",
      [APPLICATION_SUB_STAGE.INFO_NEEDED]: "Info Needed",
      [APPLICATION_SUB_STAGE.DECLINED]: "Declined",
      [APPLICATION_SUB_STAGE.RELEASED]: "Released",
      [APPLICATION_SUB_STAGE.PLAN_REJECTED]: "Plan Rejected",
      [APPLICATION_SUB_STAGE.CANCELED]: "Application Canceled",
      [APPLICATION_SUB_STAGE.CONDITIONALLY_APPROVED]: "Conditionally Approved",
      [APPLICATION_SUB_STAGE.SELECTED]: "Selected",
      [APPLICATION_SUB_STAGE.NOT_SELECTED]: "Provider Not Selected",
      [APPLICATION_SUB_STAGE.CONDITIONAL_APPROVAL_REVOKED]: "Approval Canceled",
    });
  });
});
