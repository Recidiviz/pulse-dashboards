// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { observable, runInAction } from "mobx";

import { useRootStore } from "../../../components/StoreProvider";
import { Opportunity } from "../../../WorkflowsStore";
import { dateToTimestamp } from "../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../__tests__/testUtils";
import { WorkflowProgress } from "../WorkflowProgress";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();

  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      availableOfficers: [
        { givenNames: "Test", surname: "User", email: "test@example.gov" },
      ],
    },
  });
});

test("no progress", () => {
  render(<WorkflowProgress opportunity={mockOpportunity} />);

  expect(screen.getByText("Needs review")).toBeInTheDocument();
});

test("viewed", () => {
  render(
    <WorkflowProgress
      opportunity={{
        ...mockOpportunity,
        lastViewed: {
          by: "test@example.gov",
          date: dateToTimestamp("2022-08-15"),
        },
      }}
    />
  );

  expect(useRootStoreMock).toHaveBeenCalled();

  // find the closest element that contains all of this text, which is broken up by multiple elements,
  // to avoid duplicates (which the matcher does not support by default)
  // inspired by https://stackoverflow.com/a/68429756
  const expectedText = "Viewed on 8/15/22 by Test User";
  expect(
    screen.getByText((_, element) => {
      const elementHasText = element?.textContent === expectedText;
      const childrenDontHaveText = Array.from(element?.children || []).every(
        (child) => child.textContent !== expectedText
      );
      return elementHasText && childrenDontHaveText;
    })
  ).toBeInTheDocument();
});

test("no render until hydrated", () => {
  const observableOpportunity = observable({
    ...mockOpportunity,
    hydrationState: { status: "loading" },
  } as Opportunity);
  const { container } = render(
    <WorkflowProgress opportunity={observableOpportunity} />
  );

  expect(container).toBeEmptyDOMElement();

  runInAction(() => {
    observableOpportunity.hydrationState = { status: "hydrated" };
  });

  expect(container).not.toBeEmptyDOMElement();
});
