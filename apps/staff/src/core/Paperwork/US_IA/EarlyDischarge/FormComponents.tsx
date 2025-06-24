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

import * as React from "react";

import { UsIaEarlyDischargeDraftData } from "../../../../WorkflowsStore/Opportunity/UsIa";
import { DOCXFormDropdown } from "../../DOCXFormDropdown";
import DOCXFormInput, { DOCXFormInputProps } from "../../DOCXFormInput";
import DOCXFormTextArea, { FormTextAreaProps } from "../../DOCXFormTextArea";
import DOCXFormCheckbox from "../../FormCheckbox";

export type UsIaEarlyDischargeInputProps =
  DOCXFormInputProps<UsIaEarlyDischargeDraftData>;

export const FormUsIaEarlyDischargeInput = (
  props: UsIaEarlyDischargeInputProps,
): React.ReactElement => {
  return <DOCXFormInput<UsIaEarlyDischargeDraftData> {...props} />;
};

type CheckboxProps = {
  name: Extract<keyof UsIaEarlyDischargeDraftData, string>;
  invert?: boolean;
  toggleable?: boolean;
  label?: string;
};

export const FormUsIaEarlyDischargeCheckbox: React.FC<CheckboxProps> = (
  props: CheckboxProps,
) => {
  const checkbox = <DOCXFormCheckbox<UsIaEarlyDischargeDraftData> {...props} />;
  return props.label ? (
    <label style={{ marginBottom: 0 }}>
      {checkbox}
      {props.label}
    </label>
  ) : (
    checkbox
  );
};

type DropdownProps = {
  name: Extract<keyof UsIaEarlyDischargeDraftData, string>;
  menuItems: string[];
  style?: React.CSSProperties;
};

export const FormUsIaEarlyDischargeDropdown = (props: DropdownProps) => {
  return <DOCXFormDropdown<UsIaEarlyDischargeDraftData> {...props} />;
};

type TextAreaProps = FormTextAreaProps<UsIaEarlyDischargeDraftData>;

export const FormUsIaEarlyDischargeTextArea = (
  props: TextAreaProps,
): React.ReactElement => {
  return <DOCXFormTextArea<UsIaEarlyDischargeDraftData> {...props} />;
};
