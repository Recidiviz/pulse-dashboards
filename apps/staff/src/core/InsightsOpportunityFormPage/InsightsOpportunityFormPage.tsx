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
import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOpportunityPresenter } from "../../InsightsStore/presenters/SupervisionOpportunityPresenter";
import ModelHydrator from "../ModelHydrator";
import { WorkflowsFormLayout } from "../WorkflowsLayouts";

export const FormPageWithPresenter = observer(
  function OpportunityPageWithPresenter({
    presenter,
  }: {
    presenter: SupervisionOpportunityPresenter;
  }) {
    const { opportunityType, client } = presenter;

    // If the presenter is hydrated and we're on an opportunity page, this stuff should
    // never be missing in practice.
    if (!opportunityType || !client) return <NotFound />;

    return (
      <WorkflowsFormLayout
        opportunityType={opportunityType}
        selectedPerson={client}
      />
    );
  },
);

const InsightsOpportunityFormPage = observer(
  function InsightsOpportunityFormPage() {
    const {
      insightsStore: { supervisionStore },
      workflowsRootStore: {
        justiceInvolvedPersonsStore,
        opportunityConfigurationStore,
      },
    } = useRootStore();

    const officerPseudoId = supervisionStore?.officerPseudoId;
    const oppTypeUrl = supervisionStore?.opportunityTypeUrl;
    const clientPseudoId = supervisionStore?.clientPseudoId;

    if (!officerPseudoId) return null;
    if (!oppTypeUrl) return null;
    if (!clientPseudoId) return null;
    if (!justiceInvolvedPersonsStore) return null;

    const opportunityType =
      opportunityConfigurationStore.getOpportunityTypeFromUrl(oppTypeUrl);

    const presenter = new SupervisionOpportunityPresenter(
      supervisionStore,
      justiceInvolvedPersonsStore,
      officerPseudoId,
      opportunityType,
    );

    return (
      <ModelHydrator model={presenter}>
        <FormPageWithPresenter presenter={presenter} />
      </ModelHydrator>
    );
  },
);

export default InsightsOpportunityFormPage;
