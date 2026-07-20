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
import { palette } from "~design-system";
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

export const hasNoLoginActivityInNumDays = (
  { latestLoginDate }: SupervisionOfficer,
  insightsNumDaysWithoutLogin: number,
) =>
  !latestLoginDate ||
  differenceInDays(new Date(), latestLoginDate) > insightsNumDaysWithoutLogin;

export const noLoginLabel = (insightsNumDaysWithoutLogin: number) =>
  `No Login for ${insightsNumDaysWithoutLogin} Days`;
export const noLoginTooltip = (insightsNumDaysWithoutLogin: number) =>
  `It has been more than ${insightsNumDaysWithoutLogin} days since the last login.`;

export const hasConsistentLoginActivity = (
  { hasConsistentLoginActivity: hasConsistent }: SupervisionOfficer,
  consistentLoginPillEnabled: boolean,
) => consistentLoginPillEnabled && hasConsistent === true;

export const consistentLoginLabel = "Consistent Login";
export const consistentLoginTooltip =
  "Has logged in each month for the last 12 months.";

export const loginActivityPill = (
  officer: SupervisionOfficer,
  insightsNumDaysWithoutLogin: number,
  consistentLoginPillEnabled: boolean,
) => {
  if (hasConsistentLoginActivity(officer, consistentLoginPillEnabled)) {
    return (
      <InsightsPill
        label={consistentLoginLabel}
        tooltipCopy={consistentLoginTooltip}
        color={palette.signal.highlight}
        textColor={palette.white}
      />
    );
  }
  if (hasNoLoginActivityInNumDays(officer, insightsNumDaysWithoutLogin)) {
    return (
      <InsightsPill
        label={noLoginLabel(insightsNumDaysWithoutLogin)}
        tooltipCopy={noLoginTooltip(insightsNumDaysWithoutLogin)}
      />
    );
  }
  return null;
};

export const getLatestLoginDate = ({ latestLoginDate }: SupervisionOfficer) =>
  latestLoginDate ? formatWorkflowsDate(latestLoginDate) : "Never";

const InsightsUsageCard: React.FC<{
  presenter: SupervisionSupervisorPagePresenter;
}> = observer(function InsightsUsageCard({
  presenter: {
    officersForUsageCard,
    labels,
    trackLastLoginUsageModuleViewed,
    insightsNumDaysWithoutLogin,
    numOfficersWithNoLoginActivityInLastXDays,
    pluralizeAcronym,
    labelIsAcronym,
    userCanViewConsistentLoginPill,
  },
}) {
  if (officersForUsageCard.length === 0) return null;
  trackLastLoginUsageModuleViewed();

  const label = labelIsAcronym(labels.supervisionOfficerLabel)
    ? pluralizeAcronym(
        labels.supervisionOfficerLabel,
        numOfficersWithNoLoginActivityInLastXDays,
      )
    : pluralize(
        labels.supervisionOfficerLabel,
        numOfficersWithNoLoginActivityInLastXDays,
      );

  return (
    <CardWrapper style={{ maxWidth: "501px" }}>
      <CardHeader style={{ width: "100%" }}>
        <CardHeaderText>
          <CardTitle>Date of Last Login</CardTitle>
          <CardSubtitle>
            {`${numOfficersWithNoLoginActivityInLastXDays} inactive ${label}`}
          </CardSubtitle>
        </CardHeaderText>
      </CardHeader>
      <SupervisorDetailCardList style={{ width: "100%" }}>
        {officersForUsageCard
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
              // `showPill` reserves layout space in the row's styled-components
              // (see InsightsSupervisorDetailCardListItem); it must mirror
              // whether `loginActivityPill` will actually render a pill below.
              showPill={
                hasConsistentLoginActivity(
                  officer,
                  userCanViewConsistentLoginPill,
                ) ||
                hasNoLoginActivityInNumDays(
                  officer,
                  insightsNumDaysWithoutLogin,
                )
              }
            >
              {loginActivityPill(
                officer,
                insightsNumDaysWithoutLogin,
                userCanViewConsistentLoginPill,
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
  const officerLabel = presenter.labels.supervisionOfficerLabel;
  const numDays = presenter.insightsNumDaysWithoutLogin;

  // Only describe the "Consistent Login" signal where its pill is enabled.
  const sectionDescription = presenter.userCanViewConsistentLoginPill
    ? `View the last log-in date for each ${officerLabel}. Spot ${pluralize(officerLabel)} inactive for over ${numDays} days so you can offer support, and those with consistent logins for the past 12 months to recognize.`
    : `View the last log-in date for each ${officerLabel}. Any ${officerLabel} inactive for over ${numDays} days will be flagged, so you can take action to ensure continued usage and support.`;

  return (
    <InsightsPageSection
      sectionTitle="Login Activity"
      sectionDescription={sectionDescription}
      customWidth={501}
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
