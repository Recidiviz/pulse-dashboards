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

import assertNever from "assert-never";

import {
  RNAQuestionConfig,
  RNAQuestionCopy,
  RNAQuestionId,
} from "./usNcRNAFormSpec";
import { UsNcRNARadioQuestion } from "./UsNcRNARadioQuestion";

export interface RNAQuestionProps extends RNAQuestionCopy, RNAQuestionConfig {
  id: RNAQuestionId;
}

/**
 * Component representing a question in the RNA form.
 * Renders the appropriate component based on the question format.
 */
export const UsNcRNAQuestion = function (props: RNAQuestionProps) {
  const { format, ...rest } = props;
  switch (format) {
    case "DAYS_PER_WEEK":
    case "FREQUENCY":
    case "RATIO":
    case "YES_NO":
      return <UsNcRNARadioQuestion format={format} {...rest} />;
    case "ALCOHOL_DRUGS":
    case "LIFE_AREA":
    case "NUMERIC":
      return null;
    default:
      assertNever(format);
  }
};
