/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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

import { DocumentData } from "firebase/firestore";

import { TransformFunction, UpdateFunction, ValidateFunction } from "./types";

// by default, we pass through undefined
// and retype the raw record as the formatted record
export const defaultTransformFunction: TransformFunction<any> = <DataFormat>(
  rawRecord: DocumentData | undefined
): DataFormat | undefined => {
  if (rawRecord === undefined) {
    return;
  }
  return rawRecord as DataFormat;
};

export const defaultValidateFunction: ValidateFunction<any> = <DataFormat>(
  transformedRecord: DataFormat
): void => {
  /* do no validation by default */
};

export const defaultUpdateFunction: UpdateFunction<DocumentData> = async (
  rawRecord: DocumentData | undefined
): Promise<void> => {
  /* do no updates by default */
};
