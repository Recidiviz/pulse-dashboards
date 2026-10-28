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

// The fonts the staff app loads in apps/staff/src/index.tsx. Nothing here
// comes from apps/staff, which shows the libraries render without it.
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/libre-baskerville/index.css";

import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, Fragment, ReactNode, useState } from "react";
import { MemoryRouter } from "react-router-dom";

import { GlobalStyle } from "~design-system";

import { ParoleBoardHostProvider } from "../src/host";
import { createFakeHost } from "../src/testing";

/** Applies the design-system global styles (body font, colors, box sizing). */
const withGlobalStyle: Decorator = (Story) =>
  createElement(
    Fragment,
    null,
    createElement(GlobalStyle),
    createElement(Story),
  );

/**
 * A fake host, so containers get a calendarCode and no-op analytics. A data
 * hook an example forgot to inject fails here rather than reaching a server.
 */
const withFakeHost: Decorator = (Story) =>
  createElement(ParoleBoardHostProvider, {
    host: createFakeHost(),
    children: createElement(Story),
  });

/** Holds one QueryClient for the story's lifetime. */
function FreshQueryClient({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

/** A new QueryClient per story, so no cache leaks between stories. */
const withQueryClient: Decorator = (Story) =>
  createElement(FreshQueryClient, null, createElement(Story));

/** A MemoryRouter at the story's `parameters.route`, or "/" when unset. */
const withRouter: Decorator = (Story, { parameters }) =>
  createElement(
    MemoryRouter,
    { initialEntries: [parameters["route"] ?? "/"] },
    createElement(Story),
  );

const preview: Preview = {
  // Storybook applies the last decorator outermost, so this order wraps each
  // story as MemoryRouter > QueryClientProvider > ParoleBoardHostProvider.
  decorators: [withGlobalStyle, withFakeHost, withQueryClient, withRouter],
};

export default preview;
