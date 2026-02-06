// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { rem } from "polished";
import styled from "styled-components";

import { fullRNASpec } from "~@jii/configs";
import { palette, spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../components/StoreProvider";
import { Resident } from "../../WorkflowsStore/Resident";
import ModelHydrator from "../ModelHydrator";
import { NavigationLayout, OverviewNavLinks } from "../NavigationLayout";
import { UsNcRNASingleResidentPresenter } from "./UsNcRNASingleResidentPresenter";
import { RNAResultsFooter } from "./UsNcRNASingleResidentResults/RNAResultsFooter";
import { RNAResultsHeader } from "./UsNcRNASingleResidentResults/RNAResultsHeader";
import { RNAResultsSection } from "./UsNcRNASingleResidentResults/RNAResultsSection";

const Wrapper = styled.div`
  background-color: ${palette.marble1};
  min-height: 100vh;
  max-height: 100vh;
  height: 100%;
  width: 100%;
`;

export const PaddedRNAContent = styled.div`
  padding: ${rem(spacing.md)} ${rem(72)};
`;

/**
 * View of a single person's RNA assessment results.
 */
export const ManagedComponent = observer(function UsNcRNASingleResident({
  presenter,
}: {
  presenter: UsNcRNASingleResidentPresenter;
}) {
  return (
    <Wrapper>
      <NavigationLayout>
        <OverviewNavLinks />
      </NavigationLayout>
      <RNAResultsHeader resident={presenter.selectedPerson} />
      <PaddedRNAContent>
        {fullRNASpec.map((rnaPageSpec) => {
          return (
            <RNAResultsSection
              key={rnaPageSpec.id}
              questions={rnaPageSpec.questions}
              presenter={presenter}
            />
          );
        })}
        <RNAResultsFooter resident={presenter.selectedPerson} />
      </PaddedRNAContent>
    </Wrapper>
  );
});

function usePresenter() {
  const {
    workflowsStore: { selectedPerson },
  } = useRootStore();

  if (
    !selectedPerson ||
    selectedPerson.stateCode !== "US_NC" ||
    !(selectedPerson instanceof Resident)
  ) {
    return null;
  }

  return new UsNcRNASingleResidentPresenter(selectedPerson);
}

export const UsNcRNASingleResident = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: ModelHydrator,
});
