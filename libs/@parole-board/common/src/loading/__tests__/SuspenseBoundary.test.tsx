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

import { useSuspenseQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createFakeHost, renderWithHost } from "../../testing";
import { SuspenseBoundary } from "../SuspenseBoundary";

function Months({ queryFn }: { queryFn: () => Promise<string[]> }) {
  const { data } = useSuspenseQuery({ queryKey: ["months"], queryFn });
  return <p>{data.join(", ")}</p>;
}

function Thrower({ fail }: { fail: boolean }) {
  if (fail) throw new Error("boom");
  return <p>Rendered</p>;
}

const fallback = <div data-testid="months-skeleton" />;

describe("SuspenseBoundary", () => {
  beforeEach(() => {
    // React logs every error a boundary catches.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  test("shows the skeleton while the query loads, then the content", async () => {
    let resolve: (months: string[]) => void = () => undefined;
    const queryFn = () =>
      new Promise<string[]>((r) => {
        resolve = r;
      });

    renderWithHost(
      <SuspenseBoundary fallback={fallback}>
        <Months queryFn={queryFn} />
      </SuspenseBoundary>,
    );

    expect(screen.getByTestId("months-skeleton")).toBeInTheDocument();
    resolve(["2026-09"]);
    expect(await screen.findByText("2026-09")).toBeInTheDocument();
    expect(screen.queryByTestId("months-skeleton")).not.toBeInTheDocument();
  });

  test("shows the error when the query fails, and Try again refetches", async () => {
    const queryFn = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(["2026-10"]);

    renderWithHost(
      <SuspenseBoundary fallback={fallback} errorTitle="The month didn't load.">
        <Months queryFn={queryFn} />
      </SuspenseBoundary>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The month didn't load.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("2026-10")).toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  test("reports the error it catches to the host", async () => {
    const error = new Error("Network error");
    const host = createFakeHost({ reportError: vi.fn() });

    renderWithHost(
      <SuspenseBoundary fallback={fallback}>
        <Months queryFn={() => Promise.reject(error)} />
      </SuspenseBoundary>,
      { host },
    );

    await screen.findByRole("alert");
    expect(host.reportError).toHaveBeenCalledWith(error);
  });

  // These two render without renderWithHost, whose rerender would drop its
  // providers and remount the boundary.
  test("clears the error when a reset key changes", () => {
    const { rerender } = render(
      <SuspenseBoundary fallback={fallback} resetKeys={["/2026-09"]}>
        <Thrower fail />
      </SuspenseBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <SuspenseBoundary fallback={fallback} resetKeys={["/2026-10"]}>
        <Thrower fail={false} />
      </SuspenseBoundary>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Rendered")).toBeInTheDocument();
  });

  test("keeps the error while the reset keys stay the same", () => {
    const { rerender } = render(
      <SuspenseBoundary fallback={fallback} resetKeys={["/2026-09"]}>
        <Thrower fail />
      </SuspenseBoundary>,
    );

    rerender(
      <SuspenseBoundary fallback={fallback} resetKeys={["/2026-09"]}>
        <Thrower fail={false} />
      </SuspenseBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
