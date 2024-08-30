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
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../StoreProvider/useRootStore";
import { Wordmark } from "../../Wordmark/Wordmark";
import { NavigationMenu } from "./NavigationMenu";
import { NavigationMenuPresenter } from "./NavigationMenuPresenter";
import { ResidentMiniProfile } from "./ResidentMiniProfile";
import { ResidentMiniProfilePresenter } from "./ResidentMiniProfilePresenter";

const Header = styled.header`
  align-items: flex-start;
  border-bottom: 1px solid ${palette.slate20};
  display: flex;
  gap: ${rem(spacing.md)};

  /* specificity hack vs BaseLayout */
  && {
    padding-bottom: ${rem(spacing.lg)};
  }
`;

const HeaderContent = styled.div`
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};

  > a {
    margin-right: auto;
  }
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
      <HeaderContent>
        <Link to="/">
          <Wordmark />
        </Link>

        {profilePresenter && (
          <ResidentMiniProfile presenter={profilePresenter} />
        )}
      </HeaderContent>
      <NavigationMenu
        presenter={
          new NavigationMenuPresenter(residentsStore.config, userStore)
        }
      />
    </Header>
  );
});
