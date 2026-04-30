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

import type { ReactNode } from "react";

import type { DatePresenter } from "../SentenceDates/DatePresenter";

/**
 * Most components should at least require this or something similar to it.
 * `className` allows style overrides via styled-components.
 */
export type DefaultProps = { children: ReactNode; className?: string };

/**
 * Extends {@link DefaultProps} to include a {@link DatePresenter}. All components
 * that are concerned with a single date should require this or something similar to it.
 * Most of the default components don't actually use this presenter, but it can
 * be useful context for component overrides.
 */
export type DateComponentDefaultProps = DefaultProps & {
  datePresenter: DatePresenter;
};

/**
 * Variant of {@link DateComponentDefaultProps} that only accepts string children
 */
export type DateTextComponentProps = Omit<
  DateComponentDefaultProps,
  "children"
> & {
  children: string | undefined;
};
