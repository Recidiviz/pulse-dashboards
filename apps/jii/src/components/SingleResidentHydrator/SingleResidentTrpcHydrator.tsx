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

import { useQuery } from "@tanstack/react-query";
import { memo } from "react";
import { Outlet } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { SingleResidentContextProvider, useRootStore } from "~@jii/data";
import { ErrorPageMainContent } from "~@jii/layout";
import { State } from "~@jii/paths";
import { Loading } from "~design-system";
import { castToError } from "~hydration-utils";

export const SingleResidentTrpcHydrator = memo(
  function SingleResidentTrpcHydrator() {
    const { personPseudoId: pseudonymizedId } = useTypedParams(State.Resident);

    const {
      apiClient: { trpcQuerier },
    } = useRootStore();
    const residentQuery = useQuery(
      trpcQuerier.resident.getResident.queryOptions({
        pseudonymizedId,
      }),
    );
    const residentFlagsQuery = useQuery(
      trpcQuerier.resident.getFlags.queryOptions({
        pseudonymizedId,
      }),
    );

    // error handling for each query; order is not important,
    // any failure should trigger this immediately
    const error = residentQuery.error ?? residentFlagsQuery.error;
    if (error) return <ErrorPageMainContent error={castToError(error)} />;

    // loading state waits for all queries
    if (!residentQuery.data || !residentFlagsQuery.data) return <Loading />;

    // if we've made it this far, all queries have succeeded
    return (
      <SingleResidentContextProvider
        value={{
          resident: residentQuery.data,
          // TODO(OBT-29541): this is being phased out, necessary data is on the resident object
          opportunities: [],
          residentFlags: residentFlagsQuery.data,
        }}
      >
        <Outlet />
      </SingleResidentContextProvider>
    );
  },
);
