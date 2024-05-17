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

import { ResidentsConfig } from "../../types";
import { config } from "../usMeSCCP/config";
import portionServedInfo from "./portionServedInfo.md?raw";
import releaseDateInfo from "./releaseDateInfo.md?raw";

export const usMeResidentsConfig: ResidentsConfig = {
  headerProfileFields: [
    {
      label: "Current release date",
      value:
        "{{#if resident.releaseDate}}{{formatFullDate resident.releaseDate}}{{else}}Not available{{/if}}",
      moreInfo: releaseDateInfo,
    },
    {
      // if field is missing the label will be blank,
      // and we expect that to be handled gracefully downstream
      label:
        "{{#if resident.portionServedNeeded}}{{resident.portionServedNeeded}} time date{{/if}}",
      // it's technically possible to have this date but not the release date,
      // due to data weirdness, but since this would be nonsensical to display
      // we will just suppress it if that happens
      value: `{{#if (and resident.releaseDate resident.usMePortionNeededEligibleDate)}}
        {{formatFullDate resident.usMePortionNeededEligibleDate}}
        {{else}}Not available{{/if}}`,
      moreInfo: portionServedInfo,
    },
  ],
  incarcerationOpportunities: {
    usMeSCCP: config,
  },
};
