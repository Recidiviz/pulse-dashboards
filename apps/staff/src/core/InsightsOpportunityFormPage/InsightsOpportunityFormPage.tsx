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

import NotFound from "../../components/NotFound";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import { SupervisionSupervisorOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorOpportunityPresenter";
import { WorkflowsFormLayout } from "../WorkflowsLayouts";

/**
 * Form UI component for the insights opportunity pages (accessible from supervisor
 * or officer routes)
 */
export const InsightsOpportunityFormPage = observer(
  function InsightsOpportunityFormPage({
    presenter,
  }: {
    presenter:
      | SupervisionOpportunityPresenter
      | SupervisionSupervisorOpportunityPresenter;
  }) {
    const { opportunityType, client } = presenter;

    // If the presenter is hydrated and we're on an opportunity page, this stuff should
    // never be missing in practice.
    if (!opportunityType || !client) return <NotFound />;

    return (
      <WorkflowsFormLayout
        selectedPerson={client}
        selectedOpportunityType={opportunityType}
      />
    );
  },
);
