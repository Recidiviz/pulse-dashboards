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

import { fireEvent, render } from "@testing-library/react";
import { axe } from "jest-axe";

import { AlertType } from "~@idaho-th/shared";

import { SidebarAlerts } from "../SidebarAlerts";

const LABEL = "You've been selected as the Home Plan";

const first = {
  id: "alert-1",
  type: AlertType.SELECTED_AS_HOME_PLAN,
  metadata: null,
};
const second = {
  id: "alert-2",
  type: AlertType.SELECTED_AS_HOME_PLAN,
  metadata: null,
};

test("shows the selected-as-home-plan label", () => {
  const screen = render(<SidebarAlerts alerts={[first]} onDismiss={vi.fn()} />);

  expect(screen.getByText(LABEL)).toBeInTheDocument();
});

test("shows the new-application label", () => {
  const screen = render(
    <SidebarAlerts
      alerts={[
        { id: "alert-3", type: AlertType.NEW_APPLICATION, metadata: null },
      ]}
      onDismiss={vi.fn()}
    />,
  );

  expect(screen.getByText("New application")).toBeInTheDocument();
});

test("renders one banner per alert, in the given order", () => {
  const onDismiss = vi.fn();
  const screen = render(
    <SidebarAlerts alerts={[first, second]} onDismiss={onDismiss} />,
  );

  const dismissButtons = screen.getAllByLabelText(`Dismiss: ${LABEL}`);
  expect(dismissButtons).toHaveLength(2);

  dismissButtons.forEach((button) => fireEvent.click(button));
  expect(onDismiss.mock.calls).toEqual([[first.id], [second.id]]);
});

test("renders nothing for an empty list", () => {
  const { container } = render(
    <SidebarAlerts alerts={[]} onDismiss={vi.fn()} />,
  );

  expect(container).toBeEmptyDOMElement();
});

test("dismisses the alert whose close control was clicked", () => {
  const onDismiss = vi.fn();
  const screen = render(
    <SidebarAlerts alerts={[first]} onDismiss={onDismiss} />,
  );

  fireEvent.click(screen.getByLabelText(`Dismiss: ${LABEL}`));
  expect(onDismiss).toHaveBeenCalledWith(first.id);
});

test("has no accessibility violations", async () => {
  const { container } = render(
    <SidebarAlerts alerts={[first, second]} onDismiss={vi.fn()} />,
  );

  expect(await axe(container)).toHaveNoViolations();
});
