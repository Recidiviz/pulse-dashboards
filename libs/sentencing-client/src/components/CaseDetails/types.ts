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

import { Case, Client } from "../../api";

export enum RecommendationType {
  Probation = "Probation",
  Rider = "Rider",
  Term = "Term",
  None = "None",
}

export enum ProfileStrength {
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export type Attributes = Partial<Case & Client>;

export type FormFieldBase = {
  key: keyof Attributes;
  label: string;
  value: string | string[] | null;
  inputType:
    | "text"
    | "multi-select"
    | "dropdown"
    | "dropdown-multi-select"
    | "radio";
  description?: string;
  placeholder?: string;
  options?: string[];
  showOtherContextValueMatch?: string;
  otherContext?: {
    placeholder?: string;
    value: string | string[] | null;
  };
  showNestedValueMatch?: string;
};

export type FormField = FormFieldBase & {
  nested?: { [key: string]: FormFieldBase };
};

export type FormFieldWithNestedList = FormFieldBase & {
  nested?: FormFieldBase[];
};

export type FormFieldList = FormFieldWithNestedList[];