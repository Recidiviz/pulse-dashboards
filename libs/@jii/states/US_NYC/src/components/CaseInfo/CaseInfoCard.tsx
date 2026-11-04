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

import {
  Card,
  preventFlexibleLayoutOverflow,
  TwoColumnCardWrapper,
} from "~@jii/common-ui";
import { useResidentMetadata, useSingleResidentContext } from "~@jii/data";
import { palette, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { CaseInfoPresenter } from "./CaseInfoCardPresenter";

const CardContainer = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${rem(24)};
  align-self: stretch;
`;

const CardHeading = styled.h2`
  color: ${palette.pine1};
  ${typography.Sans24}
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(24)};
`;

const CardColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
  ${preventFlexibleLayoutOverflow}
`;

const CardSubHeading = styled.h3`
  color: ${palette.slate85};

  ${typography.Sans16}
`;

const CardValue = styled.div`
  color: ${palette.pine1};

  ${typography.Sans18}
`;

export type CaseInfoData = {
  label: string;
  value: string;
};

type CaseInfoViewProps = {
  cardHeading: string;
  cardLabelValuePairs: [CaseInfoData, CaseInfoData, CaseInfoData];
};

export function CaseInfoView({
  cardHeading,
  cardLabelValuePairs,
}: CaseInfoViewProps) {
  return (
    <CardContainer>
      <CardHeading>{cardHeading}</CardHeading>
      <CardDetails>
        <TwoColumnCardWrapper>
          {cardLabelValuePairs.slice(0, 2).map(({ label, value }) => (
            <CardColumn key={label}>
              <CardSubHeading>{label}</CardSubHeading>
              <CardValue>{value}</CardValue>
            </CardColumn>
          ))}
        </TwoColumnCardWrapper>
        <CardColumn>
          <CardSubHeading>{cardLabelValuePairs[2].label}</CardSubHeading>
          <CardValue>{cardLabelValuePairs[2].value}</CardValue>
        </CardColumn>
      </CardDetails>
    </CardContainer>
  );
}

const ManagedComponent: React.FC<{ presenter: CaseInfoPresenter }> = observer(
  function CaseInfo({ presenter }) {
    return (
      <CaseInfoView
        cardHeading={presenter.cardHeading}
        cardLabelValuePairs={presenter.cardLabelValuePairs}
      />
    );
  },
);

function usePresenter() {
  const { resident } = useSingleResidentContext();
  const stateSpecificData = useResidentMetadata("US_NYC");
  return new CaseInfoPresenter(resident, stateSpecificData);
}

export const CaseInfo = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
