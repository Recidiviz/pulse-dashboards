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
import { describe, expect, Mock, test, vi } from "vitest";

import { useTypesenseStore } from "../../../../components/StoreProvider";
import { StatusCard } from "./StatusCard";

vi.mock("../../../../components/StoreProvider");

const useTypesenseStoreMock = useTypesenseStore as Mock;

const refresh = vi.fn();
const fetchHealth = vi.fn();

describe("StatusCard", () => {
  test("shows a loading indicator while the query is pending", () => {
    useTypesenseStoreMock.mockReturnValue({
      health: { status: "pending", isFetching: true },
      refresh,
      fetchHealth,
    });

    render(<StatusCard />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("shows the Healthy pill and last-checked time on success", () => {
    const checkedAt = new Date("2026-06-24T14:34:01Z");
    useTypesenseStoreMock.mockReturnValue({
      health: {
        status: "success",
        error: null,
        checkedAt,
        host: "https://typesense-staging.recidiviz.org",
        isFetching: false,
      },
      refresh,
      fetchHealth,
    });

    render(<StatusCard />);

    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Environment: Staging")).toBeInTheDocument();
    expect(
      screen.getByText(`Last checked: ${checkedAt.toLocaleTimeString()}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  test("shows the Unhealthy pill and error message on a failed health check", () => {
    const checkedAt = new Date("2026-06-24T14:34:01Z");
    useTypesenseStoreMock.mockReturnValue({
      health: {
        status: "error",
        error: new Error("Typesense reported unhealthy"),
        errorStatus: 503,
        checkedAt,
        isFetching: false,
      },
      refresh,
      fetchHealth,
    });

    render(<StatusCard />);

    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    expect(
      screen.getByText("Typesense reported unhealthy"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Last checked: ${checkedAt.toLocaleTimeString()}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  test("surfaces the unconfigured error message from the backend", () => {
    const checkedAt = new Date("2026-06-24T14:34:01Z");
    useTypesenseStoreMock.mockReturnValue({
      health: {
        status: "error",
        error: new Error(
          "TYPESENSE_HOST is not configured for this environment",
        ),
        errorStatus: 500,
        checkedAt,
        isFetching: false,
      },
      refresh,
      fetchHealth,
    });

    render(<StatusCard />);

    expect(screen.getByText("Unhealthy")).toBeInTheDocument();
    expect(
      screen.getByText("TYPESENSE_HOST is not configured for this environment"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Last checked: ${checkedAt.toLocaleTimeString()}`),
    ).toBeInTheDocument();
  });
});
