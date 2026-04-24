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

import { UsNcCreditReductionReviewDraftData } from "../../../../WorkflowsStore/Opportunity/Forms/UsNcCreditReductionReviewForm";
import DOCXFormInput, { DOCXFormInputProps } from "../../DOCXFormInput";
import DOCXFormTextArea, { FormTextAreaProps } from "../../DOCXFormTextArea";
import DOCXFormCheckbox from "../../FormCheckbox";

export type UsNcCRRInputProps =
  DOCXFormInputProps<UsNcCreditReductionReviewDraftData>;

export const UsNcCRRInput = (
  props: UsNcCRRInputProps,
): React.ReactElement<any> => {
  return (
    <DOCXFormInput<UsNcCreditReductionReviewDraftData>
      {...props}
      style={{ ...props.style, minWidth: "50px" }}
    />
  );
};

type CheckboxProps = {
  name: Extract<keyof UsNcCreditReductionReviewDraftData, string>;
  invert?: boolean;
  toggleable?: boolean;
  label?: string;
};

export const UsNcCRRCheckbox: React.FC<CheckboxProps> = (
  props: CheckboxProps,
) => {
  const checkbox = (
    <DOCXFormCheckbox<UsNcCreditReductionReviewDraftData> {...props} />
  );
  return props.label ? (
    <label style={{ marginBottom: 0 }}>
      {checkbox}
      {props.label}
    </label>
  ) : (
    checkbox
  );
};

type TextAreaProps = FormTextAreaProps<UsNcCreditReductionReviewDraftData>;

export const UsNcCRRTextArea = (
  props: TextAreaProps,
): React.ReactElement<any> => {
  return (
    <DOCXFormTextArea<UsNcCreditReductionReviewDraftData>
      style={{ fontFamily: "Arial, sans-serif" }}
      {...props}
    />
  );
};
