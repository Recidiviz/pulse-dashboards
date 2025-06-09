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

import { Icon, IconSVG } from "@recidiviz/design-system";
import React from "react";
import simplur from "simplur";

import { OpportunityInfo } from "~datatypes";
import { palette } from "~design-system";

import { useFeatureVariants } from "../../components/StoreProvider";
import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { InsightsTooltip } from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPill from "../InsightsPill";
import { InsightsSupervisorDetailCardListItem } from "./InsightsSupervisorDetailCardListItem";
import {
  CardHeader,
  CardHeaderText,
  CardSubtitle,
  CardTitle,
  CardWrapper,
  SupervisorDetailCardList,
} from "./styles";

type InsightsSupervisorOpportunityDetailCardProps = {
  opportunityInfo: OpportunityInfo;
  labels: ConfigLabels;
};

export const InsightsSupervisorOpportunityDetailCard: React.FC<
  InsightsSupervisorOpportunityDetailCardProps
> = ({
  labels,
  opportunityInfo: {
    label,
    priority,
    clientsEligibleCount,
    officersWithEligibleClients,
    opportunityType,
    zeroGrantsTooltip,
  },
}) => {
  const { zeroGrantsFlag } = useFeatureVariants();

  return (
    <CardWrapper>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>{label}</CardTitle>
          <CardSubtitle>{simplur`${clientsEligibleCount} ${labels.supervisionJiiLabel} opportunities`}</CardSubtitle>
        </CardHeaderText>
        {priority === "HIGH" ? (
          <InsightsTooltip contents={`High Priority`} maxWidth={310}>
            <Icon
              kind={IconSVG.Alert}
              strokeWidth={2}
              color={palette.data.gold1}
              width={16}
              height={16}
            />
          </InsightsTooltip>
        ) : undefined}
      </CardHeader>
      <SupervisorDetailCardList>
        {officersWithEligibleClients.map((officer) => {
          const showZeroGrantsPill =
            zeroGrantsFlag &&
            officer.zeroGrantOpportunities?.includes(opportunityType);
          return (
            <InsightsSupervisorDetailCardListItem
              officerName={officer.displayName}
              officerPseudoId={officer.pseudonymizedId}
              officerValue={officer.clientsEligibleCountWithLabel}
              showPill={!!showZeroGrantsPill}
              key={officer.pseudonymizedId}
            >
              {showZeroGrantsPill && (
                <InsightsPill
                  label="Zero Grants"
                  tooltipCopy={zeroGrantsTooltip}
                />
              )}
            </InsightsSupervisorDetailCardListItem>
          );
        })}
      </SupervisorDetailCardList>
    </CardWrapper>
  );
};
