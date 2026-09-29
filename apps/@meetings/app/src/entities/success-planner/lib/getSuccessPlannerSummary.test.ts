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
  COMPLETED_PLANNER,
  IN_PROGRESS_PLANNER,
  NOT_STARTED_PLANNER,
} from "../api/mockSuccessPlanner";
import {
  formatSenderName,
  getSuccessPlannerSummary,
} from "./getSuccessPlannerSummary";

describe("formatSenderName", () => {
  test("takes a first.last address down to an initial and a surname", () => {
    expect(formatSenderName("name.surname@email.com")).toBe("N. Surname");
  });

  test("leaves an address it can't split alone", () => {
    expect(formatSenderName("namesurname@email.com")).toBe(
      "namesurname@email.com",
    );
  });
});

describe("getSuccessPlannerSummary", () => {
  const sender = formatSenderName(COMPLETED_PLANNER.assignedBy);

  test("a not-started planner says who sent it and offers to open it", () => {
    expect(getSuccessPlannerSummary(NOT_STARTED_PLANNER)).toMatchObject({
      statusLabel: "Not started",
      title: "Success Planner",
      subtitle: `Sent to tablet by ${sender} on Aug 17, 2026`,
      actionLabel: "Open",
    });
  });

  test("an in-progress planner carries the section count and the last edit", () => {
    expect(getSuccessPlannerSummary(IN_PROGRESS_PLANNER)).toMatchObject({
      statusLabel: "In Progress",
      title: "Success Planner — 3 of 10 sections",
      subtitle: `Sent by ${sender} on Aug 17 · last updated Aug 21, 9:14am`,
      actionLabel: "Open",
    });
  });

  test("a completed planner switches the action to View responses", () => {
    expect(getSuccessPlannerSummary(COMPLETED_PLANNER)).toMatchObject({
      statusLabel: "Completed",
      title: "Success Planner — completed Aug 28, 2026",
      subtitle: `Sent by ${sender} on Aug 17 · all 10 sections answered`,
      actionLabel: "View responses",
    });
  });
});
