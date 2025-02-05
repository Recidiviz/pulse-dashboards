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
import { usMeSccpConfig } from "../usMeSCCP/config";
import { usMeWorkReleaseConfig } from "../usMeWorkRelease/config";
import releaseDateInfo from "./releaseDateInfo.md?raw";

export const usMeResidentsConfig: ResidentsConfig = {
  headerProfileFields: [
    {
      label: "Current release date",
      value:
        "{{#if resident.releaseDate}}{{formatFullDate resident.releaseDate}}{{else}}Not available{{/if}}",
      moreInfo: releaseDateInfo,
    },
  ],
  incarcerationOpportunities: {
    usMeWorkRelease: usMeWorkReleaseConfig,
    usMeSCCP: usMeSccpConfig,
  },
  home: {
    progress: {
      title: "Your Progress",
    },
    eligibility: {
      title: "Your Eligibility",
    },
    footer: {
      about: {
        title: "About this app",
        body: `This app is made by Recidiviz, a technology nonprofit.  
        It is free to access. The information updates daily.`,
      },
      contact: {
        title: "Contact us",
        body: `1322 Webster St, Suite 402  
        Oakland, CA 94612`,
      },
    },
  },
  comparisons: [
    {
      opportunities: ["usMeWorkRelease", "usMeSCCP"],
      summary: {
        text: `Learn how Work Release and SCCP compare, 
        including good time, costs, supervision and other key features.`,
        linkText: "See side-by-side comparison",
      },
      fullPage: {
        heading: "Comparing Work Release and SCCP",
        body: `Work Release and the Supervised Community Confinement Program
        are two opportunities that may be available to you while under MDOC custody.
        Each opportunity has its benefits and drawbacks depending on your needs,
        preferences, and situation. The table below helps you compare to see which
        opportunity might be the right fit for you.`,
        linkText: "Learn more",
        tableRows: [
          [
            "Residence",
            "A minimum security MDOC facility",
            "An approved residence in Maine ",
          ],
          [
            "Employment",
            "Work at a job in the community at the standard local wage",
            "Must have a job, be searching for one, or using Social Security/disability benefits (if applicable)",
          ],
          [
            "Costs and Deductions",
            "20-55% of wages deducted from paycheck for room and board, fines, restitution, savings, etc. ",
            "Must pay for your own living costs (food, housing, transportation)",
          ],
          [
            "Supervision",
            "Random weekly check-ins by facility staff at your workplace",
            "Regular check-ins with a probation officer ",
          ],
          [
            "Case Plan",
            "Must follow your case plan",
            "Must follow your case plan",
          ],
          [
            "Programs",
            "May have to complete certain programs before participating",
            "May have to complete certain programs in the community",
          ],
        ],
      },
    },
  ],
};
