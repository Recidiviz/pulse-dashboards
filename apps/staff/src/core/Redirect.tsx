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
import { useParams } from "react-router";
import { Navigate, Params } from "react-router-dom";

export const updateTo = (to: string, params: Readonly<Params<string>>) => {
  const entries = Object.entries(params);
  let path = `${to}`;

  entries.forEach(([key, value]) => {
    path = path.replace(`:${key}`, `${value}`);
  });

  return path;
};

export interface RedirectProps {
  to: string;
  state?: any;
}

/**
 * Wraps the <Navigate> component and replaces "/:<paramName>" with "/<paramValue>"
 */
export const Redirect: React.FC<RedirectProps> = ({ to, ...rest }) => {
  const params = useParams();
  return <Navigate to={updateTo(to, params)} {...rest} replace />;
};
