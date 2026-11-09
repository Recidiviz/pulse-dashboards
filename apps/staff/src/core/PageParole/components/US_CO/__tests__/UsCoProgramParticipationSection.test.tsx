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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createFakeHost } from "~@parole-board/common/testing";
import { ParoleDocProgram, ParoleEdovoProgram } from "~datatypes";

import { UsCoProgramParticipationSection } from "../UsCoProgramParticipationSection";

const DOC_PROGRAMS: Array<ParoleDocProgram> = [
  {
    name: "Thinking for a Change",
    completionDate: "2025-03-01",
    type: "Cognitive",
    criminogenicNeed: "Cognitive",
    status: "DISCHARGED_SUCCESSFUL",
  },
  {
    name: "Anger Management",
    completionDate: "2025-05-10",
    type: "Behavioral",
    criminogenicNeed: "Aggression",
    status: "DISCHARGED_SUCCESSFUL",
  },
];

const EDOVO_PROGRAMS: Array<ParoleEdovoProgram> = [
  {
    title: "Financial Literacy",
    completionDate: "2025-06-01",
    status: "completed",
  },
  { title: "Welding Basics", completionDate: null, status: "in-progress" },
];

function setup() {
  const analytics = createFakeHost().analyticsStore;
  const completedSpy = vi.spyOn(analytics, "trackPbCompletedProgramsToggled");
  const edovoSpy = vi.spyOn(analytics, "trackPbEdovoProgramsToggled");
  render(
    <UsCoProgramParticipationSection
      pseudonymizedId="pseudo-123"
      docPrograms={DOC_PROGRAMS}
      edovoPrograms={EDOVO_PROGRAMS}
      analytics={analytics}
    />,
  );
  return { completedSpy, edovoSpy };
}

describe("UsCoProgramParticipationSection analytics", () => {
  it("reports the completed programs list opening and closing", async () => {
    const { completedSpy, edovoSpy } = setup();
    const button = screen.getByRole("button", { name: /completed programs/i });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(completedSpy).toHaveBeenNthCalledWith(1, {
      pseudonymizedId: "pseudo-123",
      programCount: 2,
      isExpanded: true,
    });
    expect(completedSpy).toHaveBeenNthCalledWith(2, {
      pseudonymizedId: "pseudo-123",
      programCount: 2,
      isExpanded: false,
    });
    expect(edovoSpy).not.toHaveBeenCalled();
  });

  it("reports only completed Edovo programs in the count", async () => {
    const { completedSpy, edovoSpy } = setup();

    await userEvent.click(
      screen.getByRole("button", { name: /edovo credit programs/i }),
    );

    expect(edovoSpy).toHaveBeenCalledExactlyOnceWith({
      pseudonymizedId: "pseudo-123",
      programCount: 1,
      isExpanded: true,
    });
    expect(completedSpy).not.toHaveBeenCalled();
  });

  it("reports each list on its own when both are open", async () => {
    const { completedSpy, edovoSpy } = setup();

    await userEvent.click(
      screen.getByRole("button", { name: /completed programs/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /edovo credit programs/i }),
    );

    expect(completedSpy).toHaveBeenCalledOnce();
    expect(edovoSpy).toHaveBeenCalledOnce();
  });
});
