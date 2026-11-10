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

import React from "react";

import { BodyS1 } from "../../../../styles";
import InfoIcon from "../../../assets/information-circle.svg?react";
import { Tooltip } from "../../../common/Tooltip";
import { splitQuestionNumber } from "../../constants/questionNumberLabel";
import { useFormContext } from "../../FormContext/FormContext";
import type { HousingApplicationField } from "../../hooks/useHousingApplicationForm/utils";
import { BLOCKING_FIELDS } from "../../hooks/useHousingApplicationForm/utils";
import type { InputVariant } from "../../HousingApplicationForm.styles";
import * as Styled from "../../HousingApplicationForm.styles";
import type { Field } from "../../types";

export type FieldArgs<T = string> = {
  variant: InputVariant;
  error: string | undefined;
  field: Field<T>;
};

type FormFieldProps<T = string> = {
  field: Field<T>;
  label: string;
  tooltip?: string;
  fieldStyle?: React.CSSProperties;
  maxWidth?: string;
  children: (args: FieldArgs<T>) => React.ReactNode;
};

export function FormField<T = string>({
  field,
  label,
  tooltip,
  fieldStyle,
  maxWidth,
  children,
}: FormFieldProps<T>) {
  const { validationMessageForField, variantFor } = useFormContext();
  const fieldName = field.name as HousingApplicationField;
  const error = validationMessageForField(fieldName);
  const variant = variantFor(fieldName, error);
  const showRequiredErrorIcon =
    Boolean(error) && BLOCKING_FIELDS.includes(fieldName);
  const { text, questionNumber } = splitQuestionNumber(label);

  return (
    <Styled.Field style={fieldStyle} $maxWidth={maxWidth}>
      <Styled.LabelRow>
        <Styled.Label htmlFor={field.name}>
          <BodyS1>
            {text}
            {questionNumber ? (
              <Styled.QuestionNumber> {questionNumber}</Styled.QuestionNumber>
            ) : null}
          </BodyS1>
          {tooltip ? (
            <Tooltip content={tooltip}>
              <InfoIcon />
            </Tooltip>
          ) : null}
        </Styled.Label>
        {showRequiredErrorIcon ? <Styled.AlertTriangleIcon /> : null}
      </Styled.LabelRow>
      {children({ variant, error, field })}
    </Styled.Field>
  );
}
