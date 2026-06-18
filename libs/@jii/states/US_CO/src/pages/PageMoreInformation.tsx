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

import {
  useTypedParams,
  useTypedSearchParams,
} from "react-router-typesafe-routes/dom";

import { useSingleResidentContext } from "~@jii/data";
import { DefinitionPage } from "~@jii/layout";
import { State } from "~@jii/paths";
import { UsCoTranslationsObject, useUsCoTranslations } from "~@jii/translation";

type Props = {
  pageSlug: keyof UsCoTranslationsObject["moreInformation"]["pages"];
};

export function PageMoreInformation({ pageSlug }: Props) {
  const { t } = useUsCoTranslations();
  const { resident } = useSingleResidentContext();
  const params = useTypedParams(State.Resident.UsCoMoreInformation);
  const [{ backTarget }] = useTypedSearchParams(
    State.Resident.UsCoMoreInformation,
  );

  const backLinkProps =
    backTarget === "programs"
      ? {
          to: State.Resident.ProgramCatalog.buildPath(params),
          children: t(($) => $.moreInformation.backLink.programs),
        }
      : {
          to: State.Resident.buildPath(params),
          children: t(($) => $.moreInformation.backLink.home),
        };

  pageSlug =
    pageSlug === "earnedTime" && resident.facilityId === "YOS"
      ? "yosEarnedTime"
      : pageSlug;

  return (
    <DefinitionPage
      backLinkProps={backLinkProps}
      heading={t(($) => $.moreInformation.pages[pageSlug].heading)}
      body={t(($) => $.moreInformation.pages[pageSlug].body)}
    />
  );
}
