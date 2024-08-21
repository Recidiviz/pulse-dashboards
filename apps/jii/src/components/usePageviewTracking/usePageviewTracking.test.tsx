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

import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";

import { RootStore } from "../../datastores/RootStore";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageviewTracking } from "./usePageviewTracking";

vi.mock("../StoreProvider/useRootStore");

function TestComponent() {
  usePageviewTracking();

  return <Link to="/bar">test</Link>;
}

test("tracks pageview when location changes", () => {
  const store = new RootStore();
  vi.spyOn(store.userStore.segmentClient, "page");

  vi.mocked(useRootStore).mockReturnValue(store);

  render(
    <MemoryRouter initialEntries={["/foo"]}>
      <TestComponent />
    </MemoryRouter>,
  );

  expect(store.userStore.segmentClient.page).toHaveBeenCalledTimes(1);

  // this will navigate to another page
  fireEvent.click(screen.getByRole("link"));

  expect(store.userStore.segmentClient.page).toHaveBeenCalledTimes(2);
});
