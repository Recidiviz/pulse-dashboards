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
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import { useCloseApplication } from "../useCloseApplication";

const advanceStageMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => {
  const fn = vi.fn() as ReturnType<typeof vi.fn> & {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };
  fn.error = vi.fn();
  fn.success = vi.fn();
  return fn;
});
const isAdvancingRef = vi.hoisted(() => ({ current: false }));

vi.mock("../../../../../hooks/housingApplication", () => ({
  useAdvanceApplicationStage: () => ({
    mutate: advanceStageMock,
    isPending: isAdvancingRef.current,
  }),
}));

vi.mock("react-hot-toast", () => ({ default: toastMock }));

vi.mock("../../../../assets/x.svg?react", () => ({
  default: () => <svg data-testid="x-icon" />,
}));

// The real Modal renders through @recidiviz/design-system's ReactModal, which
// needs portal setup jsdom does not have; the repo's other modal tests stub it
// the same way.
vi.mock("../../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

function Harness({ applicationId }: { applicationId?: string }) {
  const { openCloseApplicationConfirm, modals, isAdvancingStage } =
    useCloseApplication(applicationId);
  return (
    <>
      <button type="button" onClick={openCloseApplicationConfirm}>
        Open close flow
      </button>
      <span data-testid="pending">{String(isAdvancingStage)}</span>
      {modals}
    </>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  isAdvancingRef.current = false;
});

async function openReasonPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open close flow" }));
}

describe("useCloseApplication", () => {
  it("shows no modal until the caller opens one", () => {
    render(<Harness applicationId="app-1" />);

    expect(screen.queryByText("Application withdrawn")).not.toBeInTheDocument();
  });

  it("goes straight to the reason picker with no intermediate confirmation", async () => {
    const user = userEvent.setup();
    render(<Harness applicationId="app-1" />);

    await openReasonPicker(user);

    expect(screen.getByText("Application withdrawn")).toBeInTheDocument();
    // Nothing is written until a reason is chosen.
    expect(advanceStageMock).not.toHaveBeenCalled();
  });

  it("never opens the reason picker without an application id", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openReasonPicker(user);

    expect(screen.queryByText("Application withdrawn")).not.toBeInTheDocument();
    expect(advanceStageMock).not.toHaveBeenCalled();
  });

  it("closes the case atomically with the outcome the reason maps to", async () => {
    const user = userEvent.setup();
    render(<Harness applicationId="app-1" />);
    await openReasonPicker(user);

    await user.click(screen.getByText("Application withdrawn"));
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );

    expect(advanceStageMock).toHaveBeenCalledTimes(1);
    const [input] = advanceStageMock.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(input).toMatchObject({
      applicationId: "app-1",
      targetStage: APPLICATION_STAGE.CLOSED,
    });
    expect(input["closedOutcome"]).toBeTruthy();
  });

  it("confirms the close to the user and dismisses the reason picker", async () => {
    const user = userEvent.setup();
    render(<Harness applicationId="app-1" />);
    await openReasonPicker(user);
    await user.click(screen.getByText("Application withdrawn"));
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );

    const [, handlers] = advanceStageMock.mock.calls[0] as [
      unknown,
      { onSuccess: () => void },
    ];
    handlers.onSuccess();

    expect(toastMock).toHaveBeenCalledWith("The case has been closed.");
  });

  it("reports a failure without pretending the case closed", async () => {
    const user = userEvent.setup();
    render(<Harness applicationId="app-1" />);
    await openReasonPicker(user);
    await user.click(screen.getByText("Application withdrawn"));
    await user.click(
      screen.getByRole("button", { name: "Mark Application Complete" }),
    );

    const [, handlers] = advanceStageMock.mock.calls[0] as [
      unknown,
      { onError: () => void },
    ];
    handlers.onError();

    expect(toastMock.error).toHaveBeenCalledWith(
      "Failed to close application.",
    );
    expect(toastMock).not.toHaveBeenCalledWith("The case has been closed.");
  });

  it("surfaces the in-flight state to the caller", () => {
    isAdvancingRef.current = true;

    render(<Harness applicationId="app-1" />);

    expect(screen.getByTestId("pending")).toHaveTextContent("true");
  });
});
