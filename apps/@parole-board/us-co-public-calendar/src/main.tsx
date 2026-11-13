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

import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/libre-baskerville/index.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { createPageCounts } from "./analytics/pageCounts";
import { createPublicCalendarTrpc } from "./api/client";
import { App } from "./App";

const services = {
  trpc: createPublicCalendarTrpc(import.meta.env.VITE_MODULE_BACKEND_URL),
  pageCounts: createPageCounts(
    import.meta.env.VITE_US_CO_PUBLIC_CALENDAR_SEGMENT_WRITE_KEY,
  ),
};

// Safe to assert that this exists; see index.html.
const container = document.getElementById("root") as HTMLElement;

// Navigation runs in a transition, so the month on screen stays while the
// next one loads instead of falling back to the skeleton.
createRoot(container).render(
  <BrowserRouter future={{ v7_startTransition: true }}>
    <App services={services} />
  </BrowserRouter>,
);
