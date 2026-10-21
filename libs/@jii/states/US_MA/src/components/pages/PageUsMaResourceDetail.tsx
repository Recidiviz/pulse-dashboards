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

import { GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { ResourceDetailContent } from "../Reentry/Resources/ResourceDetailContent/ResourceDetailContent";
import {
  HeaderRow,
  Wrapper,
} from "../Reentry/Resources/ResourceDetailContent/ResourceDetailContent.styles";
import { SearchButton } from "../Reentry/Resources/SearchButton/SearchButton";
import { sanitizeBackTarget } from "../Reentry/Resources/utils";
import { SuspenseQueryBoundary } from "../Reentry/SuspenseQueryBoundary";

const DetailRoute = State.Resident.UsMaReentry.Resources.CategoryResults.Detail;

export const PageUsMaResourceDetail = () => {
  const { t } = useUsMaTranslations();
  const { category, resourceId, ...residentParams } =
    useTypedParams(DetailRoute);
  const [{ backTarget }] = useTypedSearchParams(DetailRoute);

  const categoryResultsPath =
    State.Resident.UsMaReentry.Resources.CategoryResults.buildPath({
      ...residentParams,
      category,
    });

  const backPath = sanitizeBackTarget(backTarget) ?? categoryResultsPath;

  return (
    <Wrapper>
      <HeaderRow>
        <GoLink back to={backPath}>
          {t(($) => $.reentry.resources.detail.back)}
        </GoLink>
        <SearchButton />
      </HeaderRow>
      <SuspenseQueryBoundary>
        <ResourceDetailContent
          resourceId={resourceId}
          category={category}
          backPath={backPath}
        />
      </SuspenseQueryBoundary>
    </Wrapper>
  );
};
