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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { ParoleBoardHost, ParoleBoardHostProvider } from "../host";
import { createFakeHost } from "./createFakeHost";

/**
 * Renders ui inside a ParoleBoardHostProvider, a fresh QueryClientProvider
 * with retries off, and a MemoryRouter at route (default "/"). Pass host to
 * spy on its methods; it defaults to createFakeHost().
 */
export function renderWithHost(
  ui: ReactElement,
  {
    host = createFakeHost(),
    route = "/",
  }: { host?: ParoleBoardHost; route?: string } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    host,
    ...render(
      <ParoleBoardHostProvider host={host}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </ParoleBoardHostProvider>,
    ),
  };
}
