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
import { FC } from "react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { NotFound } from "~@jii/common-ui";
import { EgtCopyWrapper } from "~@jii/earned-good-time";
import { DefinitionPage } from "~@jii/layout";
import { State } from "~@jii/paths";
import { useUsNeTranslations } from "~@jii/translation";
import { withPresenterManager } from "~hydration-utils";

import { DefinitionPagePresenter } from "./DefinitionPresenter";
import { UsNeInfoPageSlugs } from "./types";

const ManagedComponent: FC<{
  presenter: DefinitionPagePresenter;
}> = observer(function Definition({ presenter }) {
  return (
    <DefinitionPage
      backLinkProps={{ ...presenter.backLink }}
      heading={presenter.heading}
      body={presenter.body}
      CopyWrapperOverride={EgtCopyWrapper}
      pageLinksFooterProps={{
        pageLinks: presenter.pageLinks,
        pageLinksHeading: presenter.pageLinksHeading,
        topLinkText: presenter.topLinkText,
      }}
    />
  );
});

function usePresenter({ pageSlug }: { pageSlug: UsNeInfoPageSlugs }) {
  const { t } = useUsNeTranslations();
  return new DefinitionPagePresenter(pageSlug, t);
}

const ManagedDefinition = withPresenterManager({
  usePresenter,
  managerIsObserver: false,
  ManagedComponent,
});

export const Definition = () => {
  const { pageSlug } = useTypedParams(State.Resident.UsNeMoreInformation);
  if (!pageSlug) return <NotFound />;
  return <ManagedDefinition pageSlug={pageSlug} />;
};
