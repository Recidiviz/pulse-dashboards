// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { startOfWeek } from "date-fns";
import { countBy } from "lodash";

import { WORKFLOWS_METHODOLOGY_URL } from "../../../../core/utils/constants";
import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import {
  DenialReasonsMap,
  Opportunity,
  OpportunityConfig,
  OpportunityTab,
} from "../..";
import { OpportunityBase } from "../../OpportunityBase";
import { generateTabs } from "../../utils/tabUtils";

export const baseUsMoOverdueRestrictiveHousingConfig = (
  usMoOverdueRHOppVariant: "Release" | "InitialHearing" | "ReviewHearing",
  fullTextPartial: string,
  callToAction: string,
  denialReasons: DenialReasonsMap = {
    Other: "Other",
  },
): OpportunityConfig<OpportunityBase<Resident, any, any>> => {
  const segregationTypeMapping = {
    Release: "Due for Release",
    InitialHearing: "Initial Hearing",
    ReviewHearing: "Upcoming Hearing",
  } as const;

  return {
    systemType: "INCARCERATION",
    stateCode: "US_MO",
    featureVariant: "usMoOverdueRHPilot",
    urlSection: `overdueRestrictiveHousing${usMoOverdueRHOppVariant}`,
    label: `${segregationTypeMapping[usMoOverdueRHOppVariant]}`,
    snooze: {
      autoSnoozeParams: {
        type: "snoozeUntil",
        params: {
          weekday: "Sunday",
        },
      },
    },
    dynamicEligibilityText: `resident[|s] ${fullTextPartial}`,
    callToAction,
    countByFunction: (opportunities: Opportunity[]) => {
      const counts = countBy(opportunities, "tabTitle") as Record<
        OpportunityTab,
        number
      >;
      const tabs = Object.keys(counts) as OpportunityTab[];
      const overdueTab = tabs.find((tab) => tab.startsWith("Overdue as of"));
      const count = overdueTab
        ? counts[overdueTab]
        : counts["Due this week"] || counts["Coming up"] || 0;
      return count;
    },
    firestoreCollection: `US_MO-overdueRestrictiveHousing${usMoOverdueRHOppVariant}Referrals`,
    tabOrder: generateTabs({
      isAlert: true,
      customTabOrder: [
        `Overdue as of ${formatWorkflowsDate(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
        )}`,
        "Due this week",
        "Coming up",
        "Overridden",
        "Missing Review Date",
      ],
    }),
    sidebarComponents: ["UsMoIncarceration", "UsMoRestrictiveHousing"],
    isAlert: true,
    methodologyUrl: WORKFLOWS_METHODOLOGY_URL.US_MO,
    denialReasons,
    compareBy: [
      {
        field: "eligibilityDate",
        undefinedBehavior: "undefinedFirst",
      },
    ],
  };
};
