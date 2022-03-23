// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { formatDate } from "../../utils";
import { formatRelativeToNow } from "../utils/timePeriod";
import { CriteriaList, EligibilityCriterion } from "./CriteriaList";
import { ClientProfileProps } from "./types";

const Wrapper = styled.div`
  background-color: rgba(37, 184, 148, 0.1);
  border-color: rgba(37, 184, 148, 0.3);
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: 0 -${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const CompliantReportingModule = observer(
  ({ client }: ClientProfileProps) => {
    if (!client.compliantReportingEligible) return null;

    const criteria: EligibilityCriterion[] = [
      {
        text: `Current supervision level: ${client.supervisionLevel}`,
        tooltip:
          "Policy requirement: Currently on medium or minimum supervision.",
      },
      {
        text: `Time on ${client.supervisionLevel}: ${formatRelativeToNow(
          client.supervisionLevelStart
        )}`,
        tooltip: `Policy requirement: On minimum supervision level for 1 year or medium level 
          for 18 months. Includes people who moved from minimum to medium in the last 18 months
          but have been on medium or less for at least 18 months`,
      },
      {
        text: `Arrests or sanctions in the past year: ${
          client.compliantReportingEligible.sanctionsPastYear
            .map((s) => s.type)
            .join(", ") || "None"
        }`,
        tooltip:
          "Policy requirement: No arrest or sanctions higher than Level 1 in the last 1 year.",
      },
      {
        text: `Fee payments occurring: ${client.finesAndFeesStatus}`,
        tooltip: `Policy requirement: Fees paid in full or partial payments are occurring in accordance 
          with payment plan. An offender with fee arrearages of $2,000 or less must make 3 payments
          on consecutive months.`,
      },
      {
        text: `Negative drug screens in last 12 months: ${
          client.compliantReportingEligible.drugNegativePastYear
            .map((d) => formatDate(d))
            .join(", ") || "None"
        }`,
        tooltip: `Policy requirement: Passed drug screen in the last 12 months for non drug offenders. 
          Passed 2 drug screens in last 12 months for drug offenders, most recent is negative.`,
      },
      {
        text: `Special conditions: ${
          client.nextSpecialConditionsCheck ? "" : "No"
        } SPE note due ${
          client.nextSpecialConditionsCheck
            ? formatDate(client.nextSpecialConditionsCheck)
            : ""
        }`,
        tooltip: "Policy requirement: Special conditions are current.",
      },
      {
        text: "Reporting: No standards overdue",
        tooltip:
          "Policy requirement: Has reported as instructed without incident unless excused and documented by the officer.",
      },
      {
        text: `Offense type: ${
          client.compliantReportingEligible.offenseType.join("; ") || "None"
        }`,
        tooltip: `Policy requirement: Offense type not domestic abuse or sexual assault, 
          DUI in past 5 years, not crime against person that resulted in physical bodily harm, 
          not crime where victim was under 18.`,
      },
    ];

    return (
      <Wrapper>
        <div>Compliant Reporting</div>
        <CriteriaList criteria={criteria} />
      </Wrapper>
    );
  }
);
