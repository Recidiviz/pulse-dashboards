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

import { useSearchParams } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { ResourceExplorer, State } from "~@jii/paths";

import { resolveResourceDetailBackTarget } from "../../components/BackTarget/utils";
import { QueryBoundary } from "../../components/QueryBoundary";
import { SearchHeader } from "../../components/SearchHeader/SearchHeader";
import { SearchHeaderContainer } from "./PageUsNycResourceDetail.styles";
import { ResourceDetailContent } from "./ResourceDetailContent";

/**
 * Split from ResourceDetailContent so Back and Search render right away instead of
 * waiting on the resource fetch, which keeps its own nested boundary.
 */
export function PageUsNycResourceDetail() {
  const [searchParams] = useSearchParams();
  const residentParams = useTypedParams(State.Resident);
  const { category } = useTypedParams(ResourceExplorer.CategoryResults);
  const { resourceId } = useTypedParams(
    ResourceExplorer.CategoryResults.Detail,
  );

  const categoryResultsPath =
    State.Resident.ResourceExplorer.CategoryResults.buildPath({
      ...residentParams,
      category,
    });

  const { backPath, similarResourcePath } = resolveResourceDetailBackTarget(
    searchParams,
    {
      residentParams,
      category,
      resourceId,
      categoryResultsPath,
    },
  );

  return (
    <>
      <SearchHeaderContainer>
        <SearchHeader backTo={backPath} />
      </SearchHeaderContainer>
      <QueryBoundary>
        <ResourceDetailContent
          resourceId={resourceId}
          category={category}
          categoryResultsPath={categoryResultsPath}
          similarResourcePath={similarResourcePath}
        />
      </QueryBoundary>
    </>
  );
}
