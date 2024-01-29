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
import { nextSunday, startOfWeek } from "date-fns";
import simplur from "simplur";

import { formatWorkflowsDate } from "../../../../utils";
import { Resident } from "../../../Resident";
import { CountFormatter, OpportunityConfig } from "../..";
import { OpportunityBase } from "../../OpportunityBase";

export const baseUsMoOverdueRestrictiveHousingConfig = (
  usMoOverdueRHOppVariant: "Release" | "InitialHearing" | "ReviewHearing",
  fullTextPartial: string,
  callToAction: string
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
      defaultSnoozeUntilFn: (snoozedOn: Date) => nextSunday(snoozedOn),
    },
    hydratedHeader: (formattedCount: CountFormatter) => ({
      fullText: simplur`${formattedCount} resident[|s] ${fullTextPartial}`,
      opportunityText: `${segregationTypeMapping[usMoOverdueRHOppVariant]}`,
      callToAction,
    }),
    firestoreCollection: `US_MO-overdueRestrictiveHousing${usMoOverdueRHOppVariant}Referrals`,
    customTabOrder: [
      `Overdue as of ${formatWorkflowsDate(
        startOfWeek(new Date(), { weekStartsOn: 1 })
      )}`,
      "Due this week",
      "Coming up",
      "Overridden",
      "Missing Review Date",
    ],
  };
};
