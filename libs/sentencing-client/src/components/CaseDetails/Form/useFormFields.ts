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

import { useState } from "react";

import { SelectOption } from "./types";

type UseFormFieldProps = {
  initialInputValue?: string | null;
  initialOtherInputValue?: string;
  initialMultiInputValues?: string[] | null;
  initialSelectValue?: SelectOption | null;
  initialMultiSelectValues?: SelectOption[] | null;
};

export function useFormField({
  initialInputValue = "",
  initialOtherInputValue = "",
  initialMultiInputValues = [],
  initialSelectValue = null,
  initialMultiSelectValues = [],
}: UseFormFieldProps) {
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [otherInputValue, setOtherInputValue] = useState(
    initialOtherInputValue,
  );
  const [multiInputValues, setMultiInputValues] = useState(
    initialMultiInputValues,
  );
  const [selectValue, setSelectValue] = useState<SelectOption | null>(
    initialSelectValue,
  );
  const [multiSelectValues, setMultiSelectValues] = useState<
    SelectOption[] | null
  >(initialMultiSelectValues);

  return {
    inputValue,
    setInputValue,
    otherInputValue,
    setOtherInputValue,
    multiInputValues,
    setMultiInputValues,
    selectValue,
    setSelectValue,
    multiSelectValues,
    setMultiSelectValues,
  };
}
