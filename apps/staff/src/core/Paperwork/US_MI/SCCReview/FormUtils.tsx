/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */
import * as React from "react";

import { UsMiSCCReviewDraftData } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiSCCReviewForm";
import DOCXFormInput from "../../DOCXFormInput";
import DOCXFormCheckbox from "../../FormCheckbox";

type InputProps = {
  name: Extract<keyof UsMiSCCReviewDraftData, string>;
  placeholder?: string;
  maxWidth?: string;
};

/**
 * A wrapper for the DOCX input for the MI SCC review form.
 */
export const FormInput: React.FC<InputProps> = (props: InputProps) => {
  return (
    <DOCXFormInput<UsMiSCCReviewDraftData>
      {...props}
      style={{ maxWidth: props.maxWidth ?? "90px", minWidth: "50px" }}
    />
  );
};

type CheckboxProps = {
  name: Extract<keyof UsMiSCCReviewDraftData, string>;
  invert?: boolean;
  toggleable?: boolean;
};

/**
 * A wrapper for the DOCX checkbox for the MI SCC review form.
 */
export const FormCheckbox: React.FC<CheckboxProps> = (props: CheckboxProps) => {
  return <DOCXFormCheckbox<UsMiSCCReviewDraftData> {...props} />;
};
