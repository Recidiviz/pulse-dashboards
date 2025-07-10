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

import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { WorkflowsHomepagePresenter } from "../../WorkflowsStore/presenters/WorkflowsHomepagePresenter";
import { CaseloadSelect } from "../CaseloadSelect";
import CaseloadTypeSelect from "../CaseloadTypeSelect/CaseloadTypeSelect";
import ModelHydrator from "../ModelHydrator";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";
import WorkflowsResults from "../WorkflowsResults";
import { OpportunitySummaries } from "./OpportunitySummaries";
import { TasksSummary } from "./TasksSummary";

const ManagedComponent = observer(function WorkflowsHomepage({
  presenter,
}: {
  presenter: WorkflowsHomepagePresenter;
}) {
  const {
    activeOpportunityTypes,
    opportunitiesByType,
    hasOpportunities,
    showTasksSummaryTop,
    showTasksSummaryBottom,
    tasks,
    ctaAndHeaderText: { headerText, ctaText },
  } = presenter;

  return (
    <WorkflowsNavLayout>
      <CaseloadTypeSelect />
      <CaseloadSelect />
      <ModelHydrator hydratable={presenter}>
        <WorkflowsResults headerText={headerText} callToActionText={ctaText}>
          {showTasksSummaryTop && <TasksSummary tasks={tasks} />}
          {hasOpportunities &&
            activeOpportunityTypes &&
            opportunitiesByType && (
              <OpportunitySummaries
                opportunityTypes={activeOpportunityTypes}
                opportunitiesByType={opportunitiesByType}
              />
            )}
          {showTasksSummaryBottom && <TasksSummary tasks={tasks} />}
        </WorkflowsResults>
      </ModelHydrator>
    </WorkflowsNavLayout>
  );
});

function usePresenter() {
  const {
    workflowsStore: { opportunityConfigurationStore },
    workflowsStore,
  } = useRootStore();

  return new WorkflowsHomepagePresenter(
    workflowsStore,
    opportunityConfigurationStore,
  );
}

const WorkflowsHomepage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});

export default WorkflowsHomepage;
