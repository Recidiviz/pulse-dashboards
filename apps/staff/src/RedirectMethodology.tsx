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

import React from "react";
import {
  generatePath,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";

import { useRootStore } from "./components/StoreProvider";
import { DASHBOARD_PATHS } from "./core/views";

export const RedirectMethodology: React.FC = () => {
  const { dashboard } = useParams();
  const { search, hash } = useLocation();
  const { analyticsStore } = useRootStore();

  const pathWithParams =
    generatePath(DASHBOARD_PATHS.methodology, {
      dashboard: dashboard ?? null,
    }) +
    search +
    hash;

  analyticsStore.trackMethodologyLinkRedirectedTo({
    path: location.pathname,
    methodologyLink: pathWithParams,
  });

  return <Navigate replace to={pathWithParams} />;
};

export default RedirectMethodology;
