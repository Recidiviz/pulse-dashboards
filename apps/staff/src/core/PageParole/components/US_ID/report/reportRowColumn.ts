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

import { ReactNode } from "react";

import { ResolvedRow } from "../../../../../ParoleStore/report/resolveSection";
import { ReportRowValues } from "./reportRowValues";

/** What a column's input receives, on a new row or in a modal. */
export type ReportRowInputProps<Fields> = {
  values: ReportRowValues<Fields>;
  // Updates the row's unsaved values. Nothing saves until the PHI clicks
  // Save or Add.
  onChange: (changes: Partial<ReportRowValues<Fields>>) => void;
  // The column's header. An input names itself with it for screen readers,
  // since an inline row's inputs sit under the header rather than beside a
  // label.
  label: string;
  // True while a save is in flight.
  disabled: boolean;
};

/**
 * One column of a report row list. A column can show and edit more than one
 * field, such as two dates stacked in one cell.
 */
export type ReportRowColumn<Fields> = {
  // Heads the column, and labels its inputs in a modal.
  header: string;
  // The fields the column shows and edits. A new row starts with each of
  // them empty.
  fields: ReadonlyArray<keyof Fields>;
  // The column's width as a CSS length. Columns without one share the rest.
  width?: string;
  // Shows the column's saved values in a lighter color, as for Past Actions'
  // dates.
  secondary?: boolean;
  // Shows a saved row's values, in read mode and on saved rows in edit mode.
  // The resolved row says where each value came from and who edited it, for
  // a section that marks the PHI's edits to Atlas values.
  display: (
    values: ReportRowValues<Fields>,
    row: ResolvedRow<Fields>,
  ) => ReactNode;
  // Renders the column's inputs, on a new row and in a modal.
  input: (props: ReportRowInputProps<Fields>) => ReactNode;
};
