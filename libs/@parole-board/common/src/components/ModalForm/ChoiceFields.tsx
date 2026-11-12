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

import {
  CheckboxGrid,
  type CheckboxGridProps,
} from "../ChoiceGrid/CheckboxGrid";
import { RadioGrid, type RadioGridProps } from "../ChoiceGrid/RadioGrid";

/**
 * The parts of a TanStack Form field, the argument form.Field passes its
 * children, that a choice grid reads and writes.
 */
export type ChoiceField<TValue, TChange> = {
  name: string;
  state: { value: TValue };
  handleChange: (value: TChange) => void;
};

export type RadioGridFieldProps = Omit<
  RadioGridProps,
  "value" | "onChange" | "name"
> & {
  /** A form.Field whose value is the chosen option's value, or none. */
  field: ChoiceField<string | null | undefined, string>;
};

/**
 * A RadioGrid bound to a TanStack Form field: it shows the field's value and
 * writes each choice back to it, and its radios take the field's name. Render
 * it inside form.Field, with RadioGridItem children.
 */
export function RadioGridField({ field, ...gridProps }: RadioGridFieldProps) {
  return (
    <RadioGrid
      {...gridProps}
      name={field.name}
      value={field.state.value ?? undefined}
      onChange={field.handleChange}
    />
  );
}

export type CheckboxGridFieldProps = Omit<
  CheckboxGridProps,
  "value" | "onChange"
> & {
  /** A form.Field whose value is the checked options' values. */
  field: ChoiceField<readonly string[], string[]>;
};

/**
 * A CheckboxGrid bound to a TanStack Form field: it shows the field's checked
 * values and writes each change back to it. Render it inside form.Field, with
 * CheckboxGridItem children.
 */
export function CheckboxGridField({
  field,
  ...gridProps
}: CheckboxGridFieldProps) {
  return (
    <CheckboxGrid
      {...gridProps}
      value={[...field.state.value]}
      onChange={field.handleChange}
    />
  );
}
