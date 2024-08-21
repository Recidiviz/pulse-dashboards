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

import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { OpportunityTabGroups } from "../../types";
import { generateTabs } from "../../utils/tabUtils";

export const baseUsIdCRCConfig = (): Pick<
  OpportunityConfig<OpportunityBase<Resident, any, any>>,
  "tabOrder"
> => ({
  tabOrder: {
    "ELIGIBILITY STATUS": generateTabs({}),
    GENDER: [
      "Cisgender Male",
      "Cisgender Female",
      "Non-Binary",
      "Transgender Male",
      "Transgender Female",
      "Transgender - Unavailable",
      "Gender Unavailable",
      "Marked Ineligible",
    ],
    "GENDER - Transgender Only": [
      "Transgender Male",
      "Transgender Female",
      "Transgender - Unavailable",
      "Marked Ineligible",
    ],
  } as unknown as Readonly<OpportunityTabGroups>,
});
