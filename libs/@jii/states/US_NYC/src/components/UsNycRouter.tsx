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

import { Outlet, Route, Routes } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { NotFound } from "~@jii/common-ui";
import { ResourceExplorer } from "~@jii/paths";

const LIST_TYPES = ["categories", "groups"] as const;
export type ListType = (typeof LIST_TYPES)[number];

function ListTypeGuard() {
  const { listType } = useTypedParams(ResourceExplorer.ListTypeResults);
  if (!LIST_TYPES.includes(listType as ListType)) return <NotFound />;
  return <Outlet />;
}

export function UsNycRouter() {
  return (
    <Routes>
      <Route index element={null} />
      <Route path={ResourceExplorer.path} element={<Outlet />}>
        <Route index element={null} />
        <Route path={ResourceExplorer.Categories.path} element={null} />
        <Route path={ResourceExplorer.Groups.path} element={null} />
        <Route
          path={ResourceExplorer.ListTypeResults.path}
          element={<ListTypeGuard />}
        >
          <Route
            path={ResourceExplorer.ListTypeResults.CategoryResults.path}
            element={null}
          >
            <Route
              path={
                ResourceExplorer.ListTypeResults.CategoryResults.Detail.path
              }
              element={null}
            />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
