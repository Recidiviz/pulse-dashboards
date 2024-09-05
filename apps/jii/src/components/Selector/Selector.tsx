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

import { Icon, palette, Sans16 } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import ReactSelect, {
  components,
  DropdownIndicatorProps,
  PropsValue,
} from "react-select";
import { ValuesType } from "utility-types";

function DropdownIndicator<Option>(
  props: DropdownIndicatorProps<Option, false>,
) {
  return (
    <components.DropdownIndicator {...props}>
      <Icon kind="DownChevron" size={12} />
    </components.DropdownIndicator>
  );
}

type SelectorOption<OptionVal> = { label: string; value: OptionVal };

export type SelectorProps<OptionVal> = {
  labelId: string;
  placeholder: string;
  options: Array<SelectorOption<OptionVal>>;
  onChange: (newValue: OptionVal) => void;
  defaultValue?: PropsValue<SelectorOption<OptionVal>>;
};

/**
 * A styled wrapper around React-Select, presenting a searchable single-select dropdown.
 */
export const Selector = observer(function Selector<OptionVal>({
  labelId,
  placeholder,
  options,
  onChange,
  defaultValue,
}: SelectorProps<OptionVal>) {
  return (
    <Sans16>
      <ReactSelect
        aria-labelledby={labelId}
        placeholder={placeholder}
        options={options}
        onChange={(selectedOption) =>
          selectedOption && onChange(selectedOption.value)
        }
        defaultValue={defaultValue}
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            borderColor: palette.pine3,
            ":hover, :focus": {
              borderColor: palette.pine1,
            },
          }),
          indicatorSeparator: () => ({ display: "none" }),
          dropdownIndicator: (baseStyles) => ({
            ...baseStyles,
            color: palette.pine3,
          }),
          placeholder: (baseStyles) => ({
            ...baseStyles,
            color: palette.slate85,
          }),
          option: (baseStyles, state) => ({
            ...baseStyles,
            color: palette.pine3,
            background: state.isFocused
              ? palette.slate10
              : state.isSelected
                ? palette.slate30
                : undefined,
            ":active": {
              color: palette.pine3,
              background: palette.slate30,
            },
          }),
        }}
        components={{
          DropdownIndicator: DropdownIndicator<ValuesType<typeof options>>,
        }}
      />
    </Sans16>
  );
});
