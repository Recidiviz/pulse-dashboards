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

import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ProviderMatchLoading } from "../ProviderMatchLoading";
import {
  PROVIDER_NETWORK_SIZE,
  SWEEP_DURATION_MS,
  SWEEP_START_MS,
  TOTAL_DURATION_MS,
} from "../ProviderMatchLoading.constants";

vi.mock("../../../assets/sparkle-duo.svg?react", () => ({
  default: () => <svg data-testid="sparkle" />,
}));

vi.mock("../../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

describe("ProviderMatchLoading", () => {
  let animationNow = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    animationNow = 0;

    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback): number =>
        setTimeout(() => {
          animationNow += 16;
          callback(animationNow);
        }, 16) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  test("renders the decorative matching copy when open", () => {
    render(<ProviderMatchLoading isOpen onComplete={vi.fn()} />);

    expect(
      screen.getByRole("status", { name: "Reviewing provider network" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reviewing provider network")).toBeInTheDocument();
    expect(screen.getByText("and counting…")).toBeInTheDocument();
    expect(screen.getByText("Search complete")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(<ProviderMatchLoading isOpen={false} onComplete={vi.fn()} />);

    expect(
      screen.queryByRole("status", { name: "Reviewing provider network" }),
    ).not.toBeInTheDocument();
  });

  test("counts up to the decorative provider network size during the sweep", () => {
    render(<ProviderMatchLoading isOpen onComplete={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(SWEEP_START_MS + SWEEP_DURATION_MS + 32);
    });

    expect(screen.getByText(String(PROVIDER_NETWORK_SIZE))).toBeInTheDocument();
    expect(screen.getByText("providers reviewed")).toBeInTheDocument();
    expect(screen.queryByText("and counting…")).not.toBeInTheDocument();
  });

  test("calls onComplete exactly once after the full animation duration", () => {
    const onComplete = vi.fn();
    render(<ProviderMatchLoading isOpen onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS - 1);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("does not call onComplete after closing before the animation finishes", () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <ProviderMatchLoading isOpen onComplete={onComplete} />,
    );

    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS / 2);
    });

    rerender(<ProviderMatchLoading isOpen={false} onComplete={onComplete} />);

    act(() => {
      vi.advanceTimersByTime(TOTAL_DURATION_MS);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  test("resets the counter when reopened", () => {
    const { rerender } = render(
      <ProviderMatchLoading isOpen onComplete={vi.fn()} />,
    );

    act(() => {
      vi.advanceTimersByTime(SWEEP_START_MS + SWEEP_DURATION_MS + 32);
    });
    expect(screen.getByText(String(PROVIDER_NETWORK_SIZE))).toBeInTheDocument();

    rerender(<ProviderMatchLoading isOpen={false} onComplete={vi.fn()} />);
    animationNow = 0;
    rerender(<ProviderMatchLoading isOpen onComplete={vi.fn()} />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("and counting…")).toBeInTheDocument();
  });
});
