// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";

import WebFormField, { WebFormFieldProps } from "./WebFormField";

type WebFormProps = {
  fields: WebFormFieldProps[];
};

export function WebForm({ fields }: WebFormProps): JSX.Element {
  return (
    <div>
      {fields.map((props) => (
        <WebFormField
          {...props}
          key={props.name}
          style={{ marginTop: rem(spacing.md) }}
        />
      ))}
    </div>
  );
}
