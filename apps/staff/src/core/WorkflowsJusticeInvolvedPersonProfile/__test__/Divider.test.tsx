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

import { render } from "@testing-library/react";

import { TaskItemDivider } from "../../WorkflowsTasks/TaskPreviewModal";
import { DetailsSection } from "../OpportunityProfile";

const displayOfEachDivider = (container: HTMLElement) =>
  [...container.querySelectorAll("hr")].map(
    (hr) => getComputedStyle(hr).display,
  );

describe("Divider", () => {
  test("shows one divider when a section between two others renders nothing", () => {
    const { container } = render(
      <div>
        <DetailsSection>
          <p>Supervision</p>
        </DetailsSection>
        <DetailsSection>{null}</DetailsSection>
        <DetailsSection>
          <p>Contact</p>
        </DetailsSection>
      </div>,
    );

    // The last divider is hidden because it is the last child.
    expect(displayOfEachDivider(container)).toEqual(["block", "none", "none"]);
  });

  test("TaskItemDivider shows one divider when two are next to each other", () => {
    const { container } = render(
      <div>
        <p>Supervision</p>
        <TaskItemDivider />
        <TaskItemDivider />
        <p>Contact</p>
      </div>,
    );

    expect(displayOfEachDivider(container)).toEqual(["block", "none"]);
  });
});
