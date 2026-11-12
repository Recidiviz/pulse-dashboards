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

import type { MonthSummary } from "~@parole-board/common";
import {
  december2026Summary,
  november2026Summary,
} from "~@parole-board/common/fixtures";

import { MonthStatusBanner } from "./MonthStatusBanner";

export default {};

const DENVER = "America/Denver";

/** A months.list month with the live counts months.get adds. */
const withCounts = (summary: MonthSummary) => ({
  ...summary,
  counts: { entryDays: 13, entryCount: 37 },
});

/** November 2026, published on Oct 5. */
export const Published = () => (
  <MonthStatusBanner
    month={withCounts(november2026Summary)}
    timeZone={DENVER}
  />
);

/** December 2026, published and then moved back to draft with Edit month. */
export const BackInDraft = () => (
  <MonthStatusBanner
    month={withCounts(december2026Summary)}
    timeZone={DENVER}
  />
);
