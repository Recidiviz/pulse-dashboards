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

/// <reference types="vite-plugin-svgr/client" />

import { InputFieldProps } from "../types";
import { TextInputField } from "./TextInputField";

export const OtherContextInputField: React.FC<InputFieldProps> = ({
  ...fieldProps
}) => {
  const { element } = fieldProps;

  const showOtherContextField = Array.isArray(element.value)
    ? element.value.some((val) =>
        element.showOtherContextValuesMatch?.includes(val),
      )
    : element.showOtherContextValuesMatch?.includes(String(element.value));

  return (
    showOtherContextField && (
      <TextInputField
        {...fieldProps}
        isOtherContext
        placeholder={element.otherContext?.placeholder}
        prevValue={element.otherContext?.value}
      />
    )
  );
};
