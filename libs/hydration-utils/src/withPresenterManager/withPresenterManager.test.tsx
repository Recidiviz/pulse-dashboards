// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { makeObservable, runInAction } from "mobx";
import * as mrl from "mobx-react-lite";
import { FC, memo, ReactNode } from "react";

import { Hydratable, HydrationState } from "../Hydratable/types";
import { Hydrator } from "../Hydrator/Hydrator";
import { withPresenterManager } from "./withPresenterManager";

vi.mock("react", async (importOriginal) => {
  const orig = await importOriginal<typeof import("react")>();
  return { ...orig, memo: vi.fn() };
});

class TestPresenter implements Hydratable {
  content: string;
  constructor() {
    makeObservable(this, { hydrationState: true });
    this.content = "foo";
  }

  hydrate = vi.fn();

  hydrationState: HydrationState = { status: "needs hydration" };
}

const TestComponent: FC<{ presenter: TestPresenter }> = ({ presenter }) => {
  return presenter.content;
};

const testHook = vi.fn();

let presenterInstance: TestPresenter;

beforeEach(() => {
  testHook.mockImplementation(() => {
    const p = new TestPresenter();
    presenterInstance = p;
    return p;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(memo).mockImplementation((Cmp: any) => Cmp);
});

describe("without hydration", () => {
  test("creates presenter", () => {
    const WrappedComponent = withPresenterManager({
      usePresenter: testHook,
      ManagedComponent: TestComponent,
      managerIsObserver: false,
    });
    render(<WrappedComponent />);
    expect(testHook).toHaveBeenCalled();
  });

  test("renders component", () => {
    const WrappedComponent = withPresenterManager({
      usePresenter: testHook,
      ManagedComponent: TestComponent,
      managerIsObserver: false,
    });
    render(<WrappedComponent />);
    expect(screen.getByText("foo")).toBeInTheDocument();
  });

  test("memoizes", () => {
    vi.spyOn(mrl, "observer");

    withPresenterManager({
      usePresenter: testHook,
      ManagedComponent: TestComponent,
      managerIsObserver: false,
    });

    expect(memo).toHaveBeenCalled();
    expect(mrl.observer).not.toHaveBeenCalled();
  });

  test("creates observer", () => {
    vi.spyOn(mrl, "observer");

    withPresenterManager({
      usePresenter: testHook,
      ManagedComponent: TestComponent,
      managerIsObserver: true,
    });
    expect(memo).not.toHaveBeenCalled();
    expect(mrl.observer).toHaveBeenCalled();
  });
});

describe("with hydration", () => {
  const TestHydrator: FC<{ children: ReactNode; hydratable: Hydratable }> = ({
    children,
    hydratable,
  }) => {
    return (
      <Hydrator hydratable={hydratable} failed={<div>error</div>}>
        {children}
      </Hydrator>
    );
  };

  let WrappedComponent: FC;

  beforeEach(() => {
    WrappedComponent = withPresenterManager({
      usePresenter: testHook,
      ManagedComponent: TestComponent,
      managerIsObserver: false,
      HydratorComponent: TestHydrator,
    });
  });

  test("creates presenter", () => {
    render(<WrappedComponent />);
    expect(testHook).toHaveBeenCalled();
  });

  test("hydration flow", async () => {
    render(<WrappedComponent />);
    expect(screen.getByText("Loading", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText("foo")).not.toBeInTheDocument();

    runInAction(() => {
      presenterInstance.hydrationState = { status: "hydrated" };
    });

    await waitFor(() => {
      expect(screen.getByText("foo")).toBeInTheDocument();
      expect(
        screen.queryByText("Loading", { exact: false }),
      ).not.toBeInTheDocument();
    });
  });
});
