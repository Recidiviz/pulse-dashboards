// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { ascending } from "d3-array";
import { differenceInDays } from "date-fns";
import { observer } from "mobx-react-lite";
import pluralize from "pluralize";

import { SupervisionOfficer } from "~datatypes";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { ModelHydratorWithoutTransitions } from "../../InsightsStore/hydrators/ModelHydratorWithoutTransitions";
import { SupervisionSupervisorPagePresenter } from "../../InsightsStore/presenters/SupervisionSupervisorPagePresenter";
import { formatWorkflowsDate } from "../../utils";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import InsightsPill from "../InsightsPill";
import { InsightsSupervisorDetailCardListItem } from "../InsightsSupervisorPage/InsightsSupervisorDetailCardListItem";
import {
  CardHeader,
  CardHeaderText,
  CardSubtitle,
  CardTitle,
  CardWrapper,
  SupervisorDetailCardList,
} from "../InsightsSupervisorPage/styles";
import ModelHydrator from "../ModelHydrator";

export const hasNoLoginActivityInLast30Days = ({
  latestLoginDate,
}: SupervisionOfficer) =>
  !latestLoginDate || differenceInDays(new Date(), latestLoginDate) > 30;

export const getLatestLoginDate = ({ latestLoginDate }: SupervisionOfficer) =>
  latestLoginDate ? formatWorkflowsDate(latestLoginDate) : "Never";

const InsightsUsageCard: React.FC<{
  presenter: SupervisionSupervisorPagePresenter;
}> = observer(function InsightsUsageCard({
  presenter: { allOfficers, labels },
}) {
  if (allOfficers.length === 0) return null;

  const numOfficersWithNoLoginActivityInLast30Days = allOfficers.filter(
    hasNoLoginActivityInLast30Days,
  ).length;
  return (
    <CardWrapper style={{ maxWidth: "501px" }}>
      <CardHeader style={{ width: "100%" }}>
        <CardHeaderText>
          <CardTitle>Date of Last Login</CardTitle>
          <CardSubtitle>
            {`${numOfficersWithNoLoginActivityInLast30Days} inactive ${pluralize(labels.supervisionOfficerLabel, numOfficersWithNoLoginActivityInLast30Days)}`}
          </CardSubtitle>
        </CardHeaderText>
      </CardHeader>
      <SupervisorDetailCardList style={{ width: "100%" }}>
        {allOfficers
          .toSorted((a, b) => {
            return (
              ascending(
                a.latestLoginDate ?? -Infinity,
                b.latestLoginDate ?? -Infinity,
              ) || ascending(a.displayName, b.displayName)
            );
          })
          .map((officer) => (
            <InsightsSupervisorDetailCardListItem
              officerName={officer.displayName}
              officerPseudoId={officer.pseudonymizedId}
              officerValue={getLatestLoginDate(officer)}
              showPill={hasNoLoginActivityInLast30Days(officer)}
            >
              {hasNoLoginActivityInLast30Days(officer) && (
                <InsightsPill
                  label="No Login for 30 Days"
                  tooltipCopy={
                    "It has been more than 30 days since the last login."
                  }
                />
              )}
            </InsightsSupervisorDetailCardListItem>
          ))}
      </SupervisorDetailCardList>
    </CardWrapper>
  );
});

const ManagedComponent: React.FC<{
  presenter: SupervisionSupervisorPagePresenter;
}> = observer(function SupervisorPagePresenter({ presenter }) {
  return (
    <InsightsPageSection
      sectionTitle="Login Activity"
      sectionDescription="View the last log-in date for each officer. Any officer inactive for over 30 days will be flagged, so you can take action to ensure continued usage and support."
    >
      <ModelHydrator hydratable={presenter}>
        <InsightsUsageCard presenter={presenter} />
      </ModelHydrator>
    </InsightsPageSection>
  );
});

const usePresenter = () => {
  const {
    insightsStore: { supervisionStore },
  } = useRootStore();

  return supervisionStore?.supervisorPseudoId
    ? new SupervisionSupervisorPagePresenter(
        supervisionStore,
        supervisionStore?.supervisorPseudoId,
      )
    : null;
};

export const InsightsManagedUsageCard = withPresenterManager({
  managerIsObserver: true,
  usePresenter,
  ManagedComponent,
  HydratorComponent: ModelHydratorWithoutTransitions,
});
