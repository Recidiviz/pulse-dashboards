// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useEffect } from "react";

import { Redirect } from "~@jii/common-ui";
import { EdovoAuthHandler, useRootStore } from "~@jii/data";

export const PageEdovoLanding = () => {
  const {
    userStore: { authManager, segmentClient },
  } = useRootStore();
  const { handler } = authManager;

  const edovoHandler =
    handler instanceof EdovoAuthHandler ? handler : undefined;
  const returnPath = edovoHandler?.returnPath;
  const returnFailed = !!edovoHandler?.returnFailed;

  useEffect(() => {
    if (returnFailed) segmentClient.trackEdovoReturnFailed();
  }, [returnFailed, segmentClient]);

  return <Redirect to={returnPath ?? "/"} />;
};
