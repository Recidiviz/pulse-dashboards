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

import { PublishedBanner } from "./PublishedBanner";

export default {};

export const Published = () => (
  <PublishedBanner
    monthLabel="September 2026"
    hearingDays={14}
    hearings={52}
    publishedAt={new Date("2026-10-09T18:27:00Z")}
    timeZone="America/Denver"
    publishedByEmail="editor@example.com"
    publicPageUrl="https://public-calendar.test/2026-09"
  />
);

export const SingularCounts = () => (
  <PublishedBanner
    monthLabel="September 2026"
    hearingDays={1}
    hearings={1}
    publishedAt={new Date("2026-10-09T18:27:00Z")}
    timeZone="America/Denver"
    publishedByEmail="editor@example.com"
    publicPageUrl="https://public-calendar.test/2026-09"
  />
);
