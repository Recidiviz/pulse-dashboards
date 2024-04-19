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

import { render, screen } from "@testing-library/react";
import { observable, set } from "mobx";

import { Hydratable } from "../Hydratable/types";
import { Hydrator } from "./Hydrator";

let testModel: Hydratable;
const mockHydrate = vi.fn();

const HYDRATED_CONTENT = "hydrated state";

function TestContent() {
  return <div>{HYDRATED_CONTENT}</div>;
}

function TestFailed() {
  return <div>error state</div>;
}

function renderTestUnit() {
  return render(
    <Hydrator hydratable={testModel} failed={<TestFailed />}>
      <TestContent />
    </Hydrator>,
  );
}

beforeEach(() => {
  // model starts off in initial state
  testModel = observable({
    hydrate: mockHydrate,
    hydrationState: { status: "needs hydration" },
  });
});

describe("initial state", () => {
  test("renders loading", () => {
    renderTestUnit();

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
    expect(screen.queryByText(HYDRATED_CONTENT)).not.toBeInTheDocument();
  });

  test("is hydrated", () => {
    renderTestUnit();

    expect(mockHydrate).toHaveBeenCalled();
  });
});

describe("loading state", () => {
  beforeEach(() => {
    set(testModel.hydrationState, { status: "loading" });
  });

  test("renders UI prop", () => {
    renderTestUnit();

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
    expect(screen.queryByText(HYDRATED_CONTENT)).not.toBeInTheDocument();
  });

  test("is not hydrated", () => {
    renderTestUnit();

    expect(mockHydrate).not.toHaveBeenCalled();
  });
});

describe("hydrated state", () => {
  beforeEach(() => {
    set(testModel.hydrationState, { status: "hydrated" });
  });

  test("renders UI prop", () => {
    renderTestUnit();

    expect(screen.getByText(HYDRATED_CONTENT)).toBeInTheDocument();
  });

  test("is not hydrated", () => {
    renderTestUnit();

    expect(mockHydrate).not.toHaveBeenCalled();
  });
});

describe("error state", () => {
  beforeEach(() => {
    set(testModel.hydrationState, {
      status: "failed",
      error: new Error("oops"),
    });
  });

  test("renders UI prop", () => {
    renderTestUnit();

    expect(screen.getByText("error state")).toBeInTheDocument();
    expect(screen.queryByText(HYDRATED_CONTENT)).not.toBeInTheDocument();
  });

  test("is not hydrated", () => {
    renderTestUnit();

    expect(mockHydrate).not.toHaveBeenCalled();
  });
});
