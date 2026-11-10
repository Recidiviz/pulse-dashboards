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

import { splitQuestionNumber } from "../../../HousingApplicationForm/constants/questionNumberLabel";
import { displayList, displayValue } from "./digitizedApplicationPdfDisplay";
import * as Styled from "./DigitizedApplicationPdfTemplate.styles";

type FieldValue = string | number | boolean | Date | null | undefined;
type FieldListValue = readonly string[] | string | undefined | null;

interface FieldProps {
  label: string;
  value: FieldValue;
  long?: boolean;
}

interface FieldListProps {
  label: string;
  value: FieldListValue;
  long?: boolean;
}

interface RowProps {
  cols: 1 | 2 | 3;
  children: React.ReactNode;
}

export function FieldRow({ cols, children }: RowProps) {
  return <Styled.FieldRow $cols={cols}>{children}</Styled.FieldRow>;
}

function FieldLabel({ label, long }: { label: string; long?: boolean }) {
  const { text, questionNumber } = splitQuestionNumber(label);
  const LabelComponent = long ? Styled.LongTextLabel : Styled.FieldLabel;
  return (
    <LabelComponent>
      {text}
      {questionNumber ? (
        <Styled.QuestionNumber> {questionNumber}</Styled.QuestionNumber>
      ) : null}
    </LabelComponent>
  );
}

export function Field({ label, value, long }: FieldProps) {
  if (long) {
    return (
      <Styled.LongTextBlock>
        <FieldLabel label={label} long />
        <Styled.LongTextValue>{displayValue(value)}</Styled.LongTextValue>
      </Styled.LongTextBlock>
    );
  }
  return (
    <Styled.FieldBlock>
      <FieldLabel label={label} />
      <Styled.FieldValue>{displayValue(value)}</Styled.FieldValue>
    </Styled.FieldBlock>
  );
}

export function FieldList({ label, value, long }: FieldListProps) {
  if (long) {
    return (
      <Styled.LongTextBlock>
        <FieldLabel label={label} long />
        <Styled.LongTextValue>{displayList(value)}</Styled.LongTextValue>
      </Styled.LongTextBlock>
    );
  }
  return (
    <Styled.FieldBlock>
      <FieldLabel label={label} />
      <Styled.FieldValue>{displayList(value)}</Styled.FieldValue>
    </Styled.FieldBlock>
  );
}
