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

import * as React from "react";

import { UsMiSCCReviewV2DraftData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiSCCReviewV2Form";
import { DOCXFormDropdown } from "../../DOCXFormDropdown";
import DOCXFormInput from "../../DOCXFormInput";
import DOCXFormRadioButton from "../../DOCXFormRadioButton";
import DOCXFormCheckbox from "../../FormCheckbox";

type InputProps = {
  name: Extract<keyof UsMiSCCReviewV2DraftData, string>;
  placeholder?: string;
  maxWidth?: string;
};

/**
 * A wrapper for the DOCX input for the MI SCC review form.
 */
export const FormInput: React.FC<InputProps> = ({
  maxWidth,
  ...props
}: InputProps) => {
  return (
    <DOCXFormInput<UsMiSCCReviewV2DraftData>
      {...props}
      style={{ maxWidth: maxWidth ?? "90px", minWidth: "50px" }}
    />
  );
};

type CheckboxProps = {
  name: Extract<keyof UsMiSCCReviewV2DraftData, string>;
  invert?: boolean;
  toggleable?: boolean;
  label?: string;
};

/**
 * A wrapper for the DOCX checkbox for the MI SCC review form.
 */
export const FormCheckbox: React.FC<CheckboxProps> = (props: CheckboxProps) => {
  const checkbox = <DOCXFormCheckbox<UsMiSCCReviewV2DraftData> {...props} />;
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
  name: Extract<keyof UsMiSCCReviewV2DraftData, string>;
  menuItems: string[];
};

/**
 * A wrapper for the DOCX dropdown for the MI SCC review form.
 */
export const FormDropdown = (props: DropdownProps) => {
  return <DOCXFormDropdown<UsMiSCCReviewV2DraftData> {...props} />;
};

type RadioButtonProps = {
  name: Extract<keyof UsMiSCCReviewV2DraftData, string>;
  targetValue: boolean | string;
  label: string;
};

/**
 * A wrapper for the DOCX radio button for the MI SCC review form.
 */
export const FormRadioButton = (props: RadioButtonProps) => {
  return <DOCXFormRadioButton<UsMiSCCReviewV2DraftData> {...props} />;
};
