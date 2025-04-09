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

import { SupervisorVitalsMetricDetail } from "../../InsightsStore/presenters/types";
import InsightsPill from "../InsightsPill";
import { InsightsSupervisorDetailCardListItem } from "./InsightsSupervisorDetailCardListItem";
import {
  CardHeader,
  CardHeaderText,
  CardTitle,
  CardWrapper,
  SupervisorDetailCardList,
} from "./styles";

type InsightsSupervisorVitalsDetailCardProps = {
  vitalsMetricDetails: SupervisorVitalsMetricDetail;
};

export const InsightsSupervisorVitalsDetailCard: React.FC<
  InsightsSupervisorVitalsDetailCardProps
> = ({ vitalsMetricDetails }) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>{vitalsMetricDetails.label}</CardTitle>
        </CardHeaderText>
      </CardHeader>
      <SupervisorDetailCardList>
        {vitalsMetricDetails.officersWithMetricValues.map((officer) => {
          const showPill = officer.metricValue < 80;
          return (
            <InsightsSupervisorDetailCardListItem
              officerName={officer.displayName}
              officerPseudoId={officer.officerPseudonymizedId}
              officerValue={`${officer.metricValue}%`}
              showPill={showPill}
              key={officer.officerPseudonymizedId}
            >
              {showPill && (
                <InsightsPill
                  label="Low Timeliness"
                  tooltipCopy="This officer is below 80% compliance."
                />
              )}
            </InsightsSupervisorDetailCardListItem>
          );
        })}
      </SupervisorDetailCardList>
    </CardWrapper>
  );
};
