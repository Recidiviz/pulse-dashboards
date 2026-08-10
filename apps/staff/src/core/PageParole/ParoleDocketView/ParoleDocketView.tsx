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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { useRootStore } from "../../../components/StoreProvider";
import { ParoleDocketPresenter } from "../../../ParoleStore/presenters/ParoleDocketPresenter";
import ModelHydrator from "../../ModelHydrator";
import { ParoleDocketTable } from "./ParoleDocketTable";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderBlock = styled.div`
  margin-bottom: ${rem(spacing.lg)};
`;

const Title = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
`;

const Subheading = styled.div`
  ${typography.Body16}
  color: ${palette.slate80};
  margin-top: ${rem(spacing.xs)};
`;

const ParoleDocketList = observer(function ParoleDocketList({
  presenter,
}: {
  presenter: ParoleDocketPresenter;
}) {
  return (
    <Wrapper>
      <HeaderBlock>
        <Title>Upcoming Hearings</Title>
        {presenter.docketSubheading && (
          <Subheading>{presenter.docketSubheading}</Subheading>
        )}
      </HeaderBlock>

      <ParoleDocketTable presenter={presenter} />
    </Wrapper>
  );
});

function usePresenter() {
  const { paroleStore } = useRootStore();
  return new ParoleDocketPresenter(paroleStore);
}

export const ParoleDocketView = withPresenterManager({
  usePresenter,
  ManagedComponent: ParoleDocketList,
  managerIsObserver: false,
  HydratorComponent: ModelHydrator,
});
