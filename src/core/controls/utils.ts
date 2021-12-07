// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { StylesConfig } from "react-select";

import { pine3, signalLinks } from "../CoreConstants.scss";
import { FilterOption } from "../types/filters";

export const coreSelectCustomStyles = (
  isChanged: boolean
): Partial<StylesConfig<FilterOption, false>> => {
  return {
    singleValue: (provided: any) => ({
      ...provided,
      color: isChanged ? signalLinks : pine3,
    }),
    control: (provided: any) => ({
      ...provided,
      color: isChanged ? signalLinks : pine3,
      border: isChanged && `1px solid ${signalLinks} !important`,
    }),
  };
};
