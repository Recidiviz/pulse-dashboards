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

import { useQuery } from "@tanstack/react-query";

import {
  useNewResidentData,
  useResidentsContext,
  useRootStore,
} from "~@jii/data";
import { ErrorPageMainContent } from "~@jii/layout";
import { Loading } from "~design-system";
import { castToError } from "~hydration-utils";

import { FirestoreResidentsSearch } from "./FirestoreResidentsSearch";
import { ResidentSearchWithPresenter } from "./ResidentSearchWithPresenter";
import { ResidentsSearchPresenter } from "./ResidentsSearchPresenter";

const TrpcResidentsSearch = () => {
  const {
    apiClient: { trpcQuerier },
  } = useRootStore();
  const newData = useQuery(trpcQuerier.resident.getFacilities.queryOptions());
  const { uiStore, userStore } = useRootStore();
  const { residentsStore } = useResidentsContext();

  if (newData.error)
    return <ErrorPageMainContent error={castToError(newData.error)} />;

  if (!newData.data) return <Loading />;

  return (
    <ResidentSearchWithPresenter
      presenter={
        new ResidentsSearchPresenter(
          newData.data,
          residentsStore,
          uiStore,
          userStore,
        )
      }
    />
  );
};

export function ResidentsSearch() {
  return useNewResidentData() ? (
    <TrpcResidentsSearch />
  ) : (
    <FirestoreResidentsSearch />
  );
}
