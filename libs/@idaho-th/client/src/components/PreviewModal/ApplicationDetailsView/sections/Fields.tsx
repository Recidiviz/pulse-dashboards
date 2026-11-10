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
import * as Styled from "../ApplicationDetailsView.styles";
import { normalizeStringList } from "../ApplicationDetailsView.utils";

const EMPTY_VALUE = "—";

type FieldProps = {
  label: string;
  value: string | number | boolean | null | undefined;
};

type MultiSelectFieldProps = {
  label: string;
  values: readonly string[] | string | undefined | null;
};

function formatTextValue(value: FieldProps["value"]): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return EMPTY_VALUE;
    const lowered = trimmed.toLowerCase();
    if (lowered === "null" || lowered === "undefined") return EMPTY_VALUE;
    return trimmed;
  }
  if (value == null) return EMPTY_VALUE;
  return String(value);
}

export const TextField: React.FC<FieldProps> = ({ label, value }) => (
  <Styled.FieldRow>
    <Styled.FieldLabel>{label}</Styled.FieldLabel>
    <Styled.FieldTextValue>{formatTextValue(value)}</Styled.FieldTextValue>
  </Styled.FieldRow>
);

export const EnumField: React.FC<FieldProps> = ({ label, value }) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return (
    <Styled.FieldRow>
      <Styled.FieldLabel>{label}</Styled.FieldLabel>
      {trimmed ? (
        <Styled.ValueBadge $variant="neutral">
          <BodyS1>{trimmed}</BodyS1>
        </Styled.ValueBadge>
      ) : (
        <Styled.FieldTextValue>{EMPTY_VALUE}</Styled.FieldTextValue>
      )}
    </Styled.FieldRow>
  );
};

function toYesNo(
  value: string | number | boolean | null | undefined,
): "Yes" | "No" | "" {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

export const YesNoField: React.FC<FieldProps> = ({ label, value }) => {
  const yesNo = toYesNo(value);
  let variant: "yes" | "no" | "neutral" = "neutral";
  if (yesNo === "Yes") variant = "yes";
  else if (yesNo === "No") variant = "no";

  return (
    <Styled.FieldRow>
      <Styled.FieldLabel>{label}</Styled.FieldLabel>
      {yesNo ? (
        <Styled.ValueBadge $variant={variant}>
          <BodyS1>{yesNo}</BodyS1>
        </Styled.ValueBadge>
      ) : (
        <Styled.FieldTextValue>{EMPTY_VALUE}</Styled.FieldTextValue>
      )}
    </Styled.FieldRow>
  );
};

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  values,
}) => {
  const items = normalizeStringList(values);
  return (
    <Styled.FieldRow>
      <Styled.FieldLabel>{label}</Styled.FieldLabel>
      {items.length > 0 ? (
        <Styled.BadgesRow>
          {items.map((item) => (
            <Styled.ValueBadge key={item} $variant="neutral">
              <BodyS1>{item}</BodyS1>
            </Styled.ValueBadge>
          ))}
        </Styled.BadgesRow>
      ) : (
        <Styled.FieldTextValue>{EMPTY_VALUE}</Styled.FieldTextValue>
      )}
    </Styled.FieldRow>
  );
};

export const LongTextField: React.FC<FieldProps> = ({ label, value }) => (
  <Styled.LongTextField>
    <Styled.FieldLabel>{label}</Styled.FieldLabel>
    <Styled.LongTextValue>{formatTextValue(value)}</Styled.LongTextValue>
  </Styled.LongTextField>
);
