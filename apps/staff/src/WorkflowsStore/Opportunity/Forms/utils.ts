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

import { formatWorkflowsDate } from "../../../utils";

type KeysWithPossibleValueType<
  RecordType extends Record<string, unknown>,
  ValueType,
> = keyof {
  [P in keyof RecordType as RecordType[P] extends ValueType | undefined
    ? P
    : never]: ValueType;
};

export const transformPossibleDateFields = <
  FormData extends Record<string, unknown>,
  DateKeys extends KeysWithPossibleValueType<FormData, Date>,
>(
  formInformation: FormData,
  fields: DateKeys[],
): Partial<Record<DateKeys, string>> => {
  return Object.keys(formInformation).reduce((acc, cur) => {
    // @ts-expect-error We expect to filter out keys not in DateKeys
    if (!fields.includes(cur)) {
      return acc;
    }

    return {
      ...acc,
      [cur]: formatWorkflowsDate(formInformation[cur] as Date),
    };
  }, {});
};

export const transformPossibleNumberFields = <
  FormData extends Record<string, unknown>,
  NumberKeys extends KeysWithPossibleValueType<FormData, number>,
>(
  formInformation: FormData,
  fields: NumberKeys[],
): Partial<Record<NumberKeys, string>> => {
  return Object.keys(formInformation).reduce((acc, cur) => {
    // @ts-expect-error We expect to filter out keys not in NumberKeys
    if (!fields.includes(cur)) {
      return acc;
    }

    return {
      ...acc,
      [cur]: (formInformation[cur] as number).toString(),
    };
  }, {});
};
