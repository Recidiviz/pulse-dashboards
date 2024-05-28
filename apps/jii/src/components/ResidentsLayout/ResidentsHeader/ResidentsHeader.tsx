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

import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../StoreProvider/useRootStore";
import { NavigationMenu } from "./NavigationMenu";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";
import { ResidentMiniProfile } from "./ResidentMiniProfile";
import { ResidentMiniProfilePresenter } from "./ResidentMiniProfilePresenter";

const Header = styled.header`
  align-items: center;
  border-bottom: 1px solid ${palette.slate20};
  display: grid;
  gap: ${rem(spacing.md)};
  grid-template-columns: 1fr max-content;
`;

export const ResidentsHeader: FC = observer(function ResidentsHeader() {
  const { residentsStore, userStore } = useRootStore();

  if (!residentsStore) return null;

  const { externalId } = userStore;
  const resident =
    externalId && residentsStore.residentsByExternalId.get(externalId);

  const profilePresenter =
    resident &&
    new ResidentMiniProfilePresenter(resident, residentsStore.config);

  return (
    <Header>
      <div>
        {profilePresenter && (
          <ResidentMiniProfile presenter={profilePresenter} />
        )}
      </div>
      <NavigationMenu
        presenter={
          new NavigationMenuPresenter(residentsStore.config, userStore)
        }
      />
    </Header>
  );
});
