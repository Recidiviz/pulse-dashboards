// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { spacing, zindex } from "@recidiviz/design-system";
import { rem } from "polished";
import ReactSelect, {
  ActionMeta,
  GroupBase,
  MultiValue,
  PropsValue,
} from "react-select";

import { palette } from "~design-system";

import useIsMobile from "../../../../hooks/useIsMobile";
import {
  caseloadSelectStyles,
  MenuListWithShadow,
  MultiValue as MultiValueOverride,
  SelectOption,
  ValueRemover,
} from "../../../CaseloadSelect";
import {
  InsightsRosterChangeRequestFormOptions,
  SelectOptionWithLocation,
} from "../../types";
import { ClearIndicator } from "./ClearIndicator";
import { Control } from "./Control";
import { Option } from "./Option";

type SupervisionOfficerSelectProps = {
  onChange: (
    newValue: MultiValue<SelectOption>,
    actionMeta: ActionMeta<SelectOption>,
  ) => void;
  setRequestChangeType: (
    value: InsightsRosterChangeRequestFormOptions["requestChangeType"],
  ) => void;
  dropdownPlaceholderText: string;
  requestChangeType: InsightsRosterChangeRequestFormOptions["requestChangeType"];
  options: SelectOptionWithLocation[];
  value: PropsValue<SelectOption> | undefined;
  staffLabel: string;
};

/**
 * SupervisionOfficerSelect component renders a customized ReactSelect input for selecting
 * multiple supervision officers. It applies custom styles based on device type and supports
 * custom components for control, options, and more.
 *
 * References
 * {@link https://react-select.com/home}
 * CaseloadSelect - The workflows base component this inherits from.
 *
 * @returns A React element rendering the customized multi-select component.
 */
export const SupervisionOfficerSelect = ({
  onChange,
  setRequestChangeType: setValue,
  dropdownPlaceholderText,
  requestChangeType,
  options,
  value,
  staffLabel,
}: SupervisionOfficerSelectProps) => {
  // Determine if the view is on a mobile device to adjust styling accordingly.
  const { isMobile } = useIsMobile(true);

  // Generate base styles for the select component.
  const styles = caseloadSelectStyles(isMobile, false, false);

  // Customize the control (input container) styles.
  styles.control = (base, state) => ({
    ...base,
    borderWidth: state.menuIsOpen ? "0" : "1px", // Remove border when menu is open
    borderStyle: "solid",
    borderColor: `${palette.slate10} !important`, // Force border color
    borderRadius: state.menuIsOpen ? "8px 8px 0 0" : rem(8), // Rounded corners; different when open
    minHeight: rem(48),
    padding: `${rem(spacing.sm)} ${rem(spacing.md)}`,
    margin: 0,
    boxShadow: state.menuIsOpen ? `0px 10px 40px ${palette.slate30}` : "none", // Optional shadow when menu is open (currently disabled)
  });

  // Customize the menu (dropdown list) styles.
  styles.menu = (base) => ({
    ...base,
    zIndex: zindex.tooltip - 1, // Ensure menu is below tooltips if needed
    margin: 0,
    border: "none",
    borderTop: `1px solid ${palette.slate20}`, // Top border to separate from control
    borderRadius: "0 0 8px 8px", // Rounded corners at the bottom
    boxShadow: `0px 15px 20px ${palette.slate20}`, // Shadow for depth effect
  });

  // Render the ReactSelect component with custom styles and components.
  return (
    <ReactSelect<
      SelectOptionWithLocation | SelectOption,
      true,
      GroupBase<SelectOption>
    >
      data-id="ReactSelect"
      form="RosterChangeRequestForm"
      onChange={onChange} // Callback when selection changes
      isMulti // Allow multiple selections
      options={options} // List of available options
      placeholder={dropdownPlaceholderText}
      styles={styles} // Apply custom styles
      value={value} // Currently selected values
      components={{
        // Override default components with custom implementations.
        Control: Control(requestChangeType, setValue),
        DropdownIndicator: null, // Hide the default dropdown indicator
        MultiValueRemove: ValueRemover,
        Option,
        ClearIndicator,
        MultiValue: MultiValueOverride,
        MenuList: MenuListWithShadow(options.length, false, staffLabel),
      }}
    />
  );
};
