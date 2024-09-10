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

import { Icon, palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import { Link } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";
import styled from "styled-components/macro";

import { State } from "../../routes/routes";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { useRootStore } from "../StoreProvider/useRootStore";
import { usePageTitle } from "../usePageTitle/usePageTitle";
import { StaticPagePresenter } from "./StaticPagePresenter";
import { PageId } from "./types";

const BackLink = styled(Link)`
  align-items: center;
  color: ${palette.signal.links};
  display: inline-flex;
  gap: ${rem(spacing.sm)};
  margin-left: -${rem(spacing.md)};
  padding: ${rem(spacing.md)};
  text-decoration: none;

  svg {
    display: inline-block;
  }
`;

const StaticPageWithPresenter: FC<{ presenter: StaticPagePresenter }> =
  observer(function StaticPageWithPresenter({ presenter }) {
    usePageTitle(presenter.htmlTitle);

    return (
      <>
        <BackLink to="../">
          <Icon kind="Arrow" rotate={180} size={13} />
          Back
        </BackLink>
        <CopyWrapper>{presenter.contents}</CopyWrapper>
      </>
    );
  });

export const StaticPage: FC<{ pageId: PageId }> = observer(function StaticPage({
  pageId,
}) {
  const { opportunitySlug } = useTypedParams(State.Eligibility.Opportunity);
  const { residentsStore } = useRootStore();

  if (!residentsStore) return;

  return (
    <StaticPageWithPresenter
      presenter={
        new StaticPagePresenter(opportunitySlug, pageId, residentsStore)
      }
    />
  );
});
