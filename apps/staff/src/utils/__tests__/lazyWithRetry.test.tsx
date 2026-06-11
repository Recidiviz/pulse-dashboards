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

import { act, render, screen, waitFor } from "@testing-library/react";
import React, { Suspense } from "react";
import { vi } from "vitest";

import { useLazyWithRetry } from "../lazyWithRetry";

function Hello() {
  return <div>hello</div>;
}

type TinyBoundaryState = { hasError: boolean };

class TinyBoundary extends React.Component<
  { children: React.ReactNode },
  TinyBoundaryState
> {
  state: TinyBoundaryState = { hasError: false };

  static getDerivedStateFromError(): TinyBoundaryState {
    return { hasError: true };
  }

  reset(): void {
    this.setState({ hasError: false });
  }

  render(): React.ReactNode {
    if (this.state.hasError) return <div>boom</div>;
    return this.props.children;
  }
}

const retryRef: { current: (() => void) | null } = { current: null };

function Harness({
  factory,
}: {
  factory: () => Promise<{ default: typeof Hello }>;
}) {
  const [Lazy, retry] = useLazyWithRetry(factory);
  retryRef.current = retry;
  return (
    <Suspense fallback={<div>loading</div>}>
      <Lazy />
    </Suspense>
  );
}

describe("useLazyWithRetry", () => {
  it("returns the cached module without re-invoking the factory after a successful import", async () => {
    const factory = vi.fn().mockResolvedValue({ default: Hello });

    const { rerender } = render(<Harness factory={factory} />);
    await waitFor(() => expect(screen.getByText("hello")).toBeInTheDocument());

    rerender(<Harness factory={factory} />);
    await waitFor(() => expect(screen.getByText("hello")).toBeInTheDocument());

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("re-invokes the factory after retry() following a rejected import", async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error("ChunkLoadError"))
      .mockResolvedValueOnce({ default: Hello });

    const boundaryRef = React.createRef<TinyBoundary>();
    render(
      <TinyBoundary ref={boundaryRef}>
        <Harness factory={factory} />
      </TinyBoundary>,
    );

    await waitFor(() => expect(screen.getByText("boom")).toBeInTheDocument());
    expect(factory).toHaveBeenCalledTimes(1);

    // Bumping retry() creates a fresh LazyExoticComponent, bypassing React.lazy's
    // cached rejection. Reset the boundary too so the new tree renders.
    act(() => {
      retryRef.current?.();
      boundaryRef.current?.reset();
    });

    await waitFor(() => expect(screen.getByText("hello")).toBeInTheDocument());
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
