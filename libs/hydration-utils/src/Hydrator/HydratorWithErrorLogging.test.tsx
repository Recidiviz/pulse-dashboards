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

import { render, screen, waitFor } from "@testing-library/react";
import { observable, set } from "mobx";

import { Hydratable } from "../Hydratable/types";
import { HydratorWithErrorLogging } from "./HydratorWithErrorLogging";

let testModel: Hydratable;

beforeEach(() => {
  // model starts off in initial state
  testModel = observable({
    hydrate: vi.fn(),
    hydrationState: { status: "needs hydration" },
  });
});

test("error state", async () => {
  render(
    <HydratorWithErrorLogging
      hydratable={testModel}
      fallback={({ error }) => <div>{error.message}</div>}
    >
      <div>test content</div>
    </HydratorWithErrorLogging>,
  );

  expect(screen.getByText("Loading data...")).toBeInTheDocument();

  set(testModel.hydrationState, {
    status: "failed",
    error: new Error("oops"),
  });

  await waitFor(() => expect(screen.getByText("oops")).toBeInTheDocument());
});
