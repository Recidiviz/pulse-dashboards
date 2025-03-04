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

import { observer } from "mobx-react-lite";
import { useState } from "react";

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerPagePresenter } from "../../InsightsStore/presenters/SupervisionOfficerPagePresenter";
import { ManagedStaffHighlightedOfficersBanner } from "../InsightsHighlightedOfficersBanner/InsightsManagedStaffHighlightedOfficersBanner";
import InsightsPageLayout from "../InsightsPageLayout";
import { InsightsBreadcrumbs } from "../InsightsSupervisorPage/InsightsBreadcrumbs";
import ModelHydrator from "../ModelHydrator";
import { insightsUrl } from "../views";
import { InsightsOpportunitySummary } from "./InsightsOpportunitySummary";
import { InsightsStaffOutcomesSection } from "./InsightsStaffOutcomesSection";
import { InsightsStaffVitals } from "./InsightsStaffVitals";

const ManagedComponent = observer(function StaffPage({
  presenter,
}: {
  presenter: SupervisionOfficerPagePresenter;
}) {
  const [initialPageLoad, setInitialPageLoad] = useState<boolean>(true);

  const {
    officerOutcomesData,
    officerRecord,
    officerPseudoId,
    supervisorsInfo,
    goToSupervisorInfo,
    labels,
    userCanAccessAllSupervisors,
    numClientsOnCaseload,
  } = presenter;

  // TODO(#5780): move infoItems to presenter
  const infoItems = [
    {
      title: "active clients",
      info: numClientsOnCaseload,
    },
    // TODO(#5780): move infoItems to presenter
    {
      title: "avg daily caseload",
      info: officerOutcomesData?.avgDailyPopulation,
    },
    {
      title: "caseload type",
      info:
        (presenter.areCaseloadCategoryBreakdownsEnabled &&
          officerOutcomesData?.caseloadCategoryName) ||
        null,
    },
  ];

  if (initialPageLoad) {
    presenter.trackStaffPageViewed();
    setInitialPageLoad(false);
  }

  return (
    <InsightsPageLayout
      pageTitle={officerRecord?.displayName}
      infoItems={infoItems}
      contentsAboveTitle={
        supervisorsInfo &&
        goToSupervisorInfo && (
          <InsightsBreadcrumbs
            previousPages={[
              ...(userCanAccessAllSupervisors
                ? [
                    {
                      title: "All Supervisors",
                      url: insightsUrl("supervisionSupervisorsList"),
                    },
                  ]
                : []),
              {
                title: `${goToSupervisorInfo.displayName || labels.supervisionSupervisorLabel} Overview`,
                url: insightsUrl("supervisionSupervisor", {
                  supervisorPseudoId: goToSupervisorInfo.pseudonymizedId,
                }),
              },
            ]}
          >
            {officerRecord?.displayName} Profile
          </InsightsBreadcrumbs>
        )
      }
      highlightedOfficers={<ManagedStaffHighlightedOfficersBanner />}
    >
      <InsightsStaffOutcomesSection />
      <InsightsOpportunitySummary />
      <InsightsStaffVitals officerPseudoId={officerPseudoId} />
    </InsightsPageLayout>
  );
});

function usePresenter() {
  const {
    insightsStore: { supervisionStore },
    workflowsRootStore: { justiceInvolvedPersonsStore },
  } = useRootStore();
  const officerPseudoId = supervisionStore?.officerPseudoId;

  if (!officerPseudoId || !justiceInvolvedPersonsStore) return null;

  return new SupervisionOfficerPagePresenter(
    supervisionStore,
    officerPseudoId,
    justiceInvolvedPersonsStore,
  );
}

const InsightsStaffPageV2 = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});

export default InsightsStaffPageV2;
