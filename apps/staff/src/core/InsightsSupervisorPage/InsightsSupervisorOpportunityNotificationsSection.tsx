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

import { observer } from "mobx-react-lite";
import pluralize from "pluralize";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionSupervisorOpportunitiesPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunitiesPresenter";
import InsightsNotificationSupervisorOpportunityBanner from "../InsightsNotification/InsightsNotificationSupervisorOpportunityBanner";
import ModelHydrator from "../ModelHydrator";

const usePresenter = () => {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: {
      justiceInvolvedPersonsStore,
      opportunityConfigurationStore,
    },
  } = useRootStore();

  if (
    !supervisionStore?.supervisorPseudoId ||
    !justiceInvolvedPersonsStore ||
    !opportunityConfigurationStore
  )
    return null;

  return new SupervisionSupervisorOpportunitiesPresenter(
        supervisionStore,
        supervisionStore?.supervisorPseudoId,
        justiceInvolvedPersonsStore,
        opportunityConfigurationStore,
      );
};

const ManagedComponent: React.FC<{
  presenter: SupervisionSupervisorOpportunitiesPresenter;
}> = observer(function OpportunityNotificationsSection({
  presenter: {
    alertOpportunitiesNotificationsByOpportunityType,
    supervisorInfo,
    labels: { supervisionJiiLabel: jiiLabel, supervisionUnitLabel },
    supervisorIsCurrentUser,
  },
}) {
  if (!supervisorInfo || !alertOpportunitiesNotificationsByOpportunityType) {
    return null;
  }

  const possessivePronoun = supervisorIsCurrentUser
    ? "your"
    : `${supervisorInfo.displayName}'s`;

  return (
    <>
      {Object.entries(alertOpportunitiesNotificationsByOpportunityType)
        .filter(([_, alertData]) => alertData?.notifications.length)
        .map(([opportunityType, { notifications, seeMoreLink }]) => (
          <InsightsNotificationSupervisorOpportunityBanner
            key={opportunityType}
            title={`${pluralize(jiiLabel, notifications.length)} in ${possessivePronoun} unit who may need more support`}
            seeMoreLink={seeMoreLink}
            notifications={notifications}
            seeMoreLinkText={`See all ${notifications.length} ${pluralize(jiiLabel, notifications.length)}`}
          />
        ))}
    </>
  );
});

export const InsightsSupervisorOpportunityNotificationsSection =
  withPresenterManager({
    usePresenter,
    managerIsObserver: true,
    ManagedComponent,
    HydratorComponent: ModelHydrator,
  });
