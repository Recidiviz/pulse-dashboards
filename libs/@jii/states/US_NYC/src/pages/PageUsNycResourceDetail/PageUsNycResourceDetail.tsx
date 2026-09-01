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

import { sanitizeBackTarget } from "../../components/BackTargetContext/sanitizeBackTarget";
import { useBackTarget } from "../../components/BackTargetContext/useBackTarget";
import { QueryBoundary } from "../../components/QueryBoundary";
import { ResourceDetailContent } from "./ResourceDetailContent";

/**
 * Split from ResourceDetailContent so useBackTarget() fires immediately on mount instead
 * of waiting on the resource fetch. The content fetch keeps its own nested boundary
 * so it can't block this shell - otherwise BackButton flashes to the logo while data loads.
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

  const { backTarget } =
    ResourceExplorer.CategoryResults.Detail.getTypedSearchParams(searchParams);
  // Unlike the paths we build ourselves, this one comes from the URL search params and isn't safe as-is
  const safeBackTarget = sanitizeBackTarget(backTarget);
  useBackTarget(safeBackTarget ?? categoryResultsPath);

  const detailPath = (resourceId: number) => {
    const path =
      State.Resident.ResourceExplorer.CategoryResults.Detail.buildPath({
        ...residentParams,
        category,
        resourceId,
      });
    return safeBackTarget
      ? `${path}?backTarget=${encodeURIComponent(safeBackTarget)}`
      : path;
  };

  return (
    <QueryBoundary>
      <ResourceDetailContent
        resourceId={resourceId}
        category={category}
        categoryResultsPath={categoryResultsPath}
        detailPath={detailPath}
      />
    </QueryBoundary>
  );
}
