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

import { render, screen } from "@testing-library/react-native";
import React from "react";

import { AgencyConfigProvider } from "../../context/AgencyConfigContext";
import { trpc } from "../../trpc/client";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../trpc/client", () => ({
  trpc: {
    v1: {
      config: {
        getAll: { useQuery: jest.fn() },
      },
    },
  },
}));

const mockUseQuery = trpc.v1.config.getAll.useQuery as jest.Mock;

describe("AgencyConfigProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when query succeeds", () => {
    mockUseQuery.mockReturnValue({
      data: { US_NE: { stateCode: "US_NE", name: "Nebraska" } },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    });

    render(<AgencyConfigProvider>{null}</AgencyConfigProvider>);

    expect(screen.queryByText("Something went wrong")).toBeNull();
  });

  it("shows ConfigErrorScreen when query has a terminal error", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: jest.fn(),
    });

    render(<AgencyConfigProvider>{null}</AgencyConfigProvider>);

    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("does not show ConfigErrorScreen while a refetch is in flight (e.g. after restoring a cached error)", () => {
    // Simulates a persisted failed query being restored from cache: isError=true but isFetching=true
    // because a background refetch is already running.
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: true,
      refetch: jest.fn(),
    });

    render(<AgencyConfigProvider>{null}</AgencyConfigProvider>);

    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});
