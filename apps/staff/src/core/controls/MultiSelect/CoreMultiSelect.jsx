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

import "./CoreMultiSelect.scss";

import cn from "classnames";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef } from "react";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
} from "~design-system";

import { optionPropType } from "../../../controls/propTypes";
import {
  formatSelectOptionValue,
  getNewOptions,
  VALUE_CHARACTER_LIMIT,
} from "../../../controls/utils";

function CustomScrollBarWrapper({ children }) {
  return (
    <div style={{ overflowY: "auto", maxHeight: 250 }} tabIndex={-1}>
      {children}
    </div>
  );
}

const CustomDropdownIndicator = () => {
  return (
    <div className="CoreSelect__custom-indicator">
      <span className={cn("CoreSelect__custom-arrow", {})} />
    </div>
  );
};

function CoreMultiSelect({
  summingOption,
  options,
  value,
  onChange,
  className = "",
  id,
  ...props
}) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && ref.current.state.menuIsOpen) {
      ref.current.select?.focus();
    }
  }, [value]);

  useEffect(() => {
    const input = document.querySelector(`#${id} input`);
    if (input) {
      input.setAttribute("readonly", "");
      input.setAttribute("aria-labelledby", `${id}`);
    }
  });

  const handleChange = useCallback(
    (option) => {
      // Check if option is already selected
      const isSelected = value.some(
        (selectedOption) => selectedOption.value === option.value,
      );

      let newSelectedOptions;
      if (isSelected) {
        // Remove option from selected options
        newSelectedOptions = value.filter(
          (selectedOption) => selectedOption.value !== option.value,
        );
      } else {
        // Add option to selected options
        newSelectedOptions = [...value, option];
      }

      const newOptions = getNewOptions(
        options,
        summingOption,
        newSelectedOptions,
      );
      onChange(newOptions);
    },
    [onChange, options, summingOption, value],
  );

  // Format display text for the toggle button
  const displayText = useMemo(() => {
    const selectedOptions = value || [];

    if (selectedOptions.length === 0) {
      return "Select options...";
    }

    const isSummingOptionSelected =
      summingOption &&
      selectedOptions.length === 1 &&
      selectedOptions[0].value === summingOption.value;

    if (isSummingOptionSelected) {
      return summingOption.label;
    }

    const text = formatSelectOptionValue({
      allOptions: options,
      summingOption,
      selectedOptions,
    });

    return text.length > VALUE_CHARACTER_LIMIT
      ? `${text.slice(0, VALUE_CHARACTER_LIMIT)}...`
      : text;
  }, [value, options, summingOption]);

  return (
    <Dropdown className={"CoreMultiSelect"} id={id}>
      <DropdownToggle
        kind="link"
        aria-label={`Select ${id}`}
        className={cn("CoreMultiSelect__control", {
          "CoreMultiSelect__control--changed": props.isChanged,
        })}
        // Override the tabIndex in DropdownToggle since this is in a Toolbar
        tabIndex={-1}
      >
        <div
          className="CoreMultiSelect__value-container"
          aria-label="Current value"
        >
          {displayText}
        </div>
        <CustomDropdownIndicator />
      </DropdownToggle>
      <DropdownMenu
        alignment="right"
        className="CoreMultiSelect__menu"
        ariaLabel={`${id} dropdown menu`}
      >
        <CustomScrollBarWrapper>
          {options.map((option) => {
            return (
              <DropdownMenuItem
                key={option.value}
                preventCloseOnClickEvent
                className={`CoreMultiSelect__option ${option.value === value[0].value ? "CoreMultiSelect__option--selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleChange(option);
                }}
              >
                <label className="MultiSelect__checkbox-container">
                  {option.label}
                  <input
                    type="checkbox"
                    checked={value.some(
                      (selectedOption) => selectedOption.value === option.value,
                    )}
                    className="MultiSelect__checkbox-input"
                    onClick={() => handleChange(option)}
                    tabIndex={-1}
                  />
                  <span className="MultiSelect__checkbox" />
                </label>
              </DropdownMenuItem>
            );
          })}
        </CustomScrollBarWrapper>
      </DropdownMenu>
    </Dropdown>
  );
}

CoreMultiSelect.defaultProps = {
  className: "",
  isChanged: false,
};
CoreMultiSelect.propTypes = {
  defaultValue: PropTypes.arrayOf(optionPropType).isRequired,
  value: PropTypes.arrayOf(optionPropType).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  className: PropTypes.string,
  summingOption: optionPropType.isRequired,
  isChanged: PropTypes.bool,
  id: PropTypes.string,
};
CustomScrollBarWrapper.propTypes = {
  children: PropTypes.arrayOf(optionPropType).isRequired,
};

export default CoreMultiSelect;
