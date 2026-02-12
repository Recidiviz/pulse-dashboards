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

import { useSuspenseQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { fullRNASpec } from "~@jii/configs";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../../components/StoreProvider";
import { Resident } from "../../../WorkflowsStore/Resident";
import { ResultsPagePresenter } from "./ResultsPagePresenter";
import { RNAResultsFooter } from "./RNAResultsFooter";
import { RNAResultsHeader } from "./RNAResultsHeader";
import { RNAResultsSection } from "./RNAResultsSection";

export const PaddedRNAContent = styled.div`
  padding: ${rem(spacing.md)} ${rem(72)};
`;

/**
 * View of a single person's RNA assessment results.
 */
export const ManagedComponent = observer(function ResultsPage({
  presenter,
}: {
  presenter: ResultsPagePresenter;
}) {
  return (
    <>
      <RNAResultsHeader presenter={presenter} />
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
        <RNAResultsFooter presenter={presenter} />
      </PaddedRNAContent>
    </>
  );
});

type Props = { resident: Resident };

function usePresenter({ resident }: Props) {
  const {
    jiiTrpc: { querier, client },
  } = useRootStore();

  const { data } = useSuspenseQuery(
    querier.staff.usNc.getRNA.queryOptions({
      pseudonymizedId: resident.pseudonymizedId,
    }),
  );

  return new ResultsPagePresenter(resident, data, client);
}

export const ResultsPage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
